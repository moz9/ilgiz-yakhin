import rules from "./petrovich-rules.json";

/**
 * Russian document text: full-name declension by the Petrovich rule tables (MIT, see
 * PETROVICH-LICENSE), initials, an amount in words and dates the way an order spells them.
 */
export type NameCase = "nominative" | "genitive" | "dative" | "accusative";
type Rule = { gender: string; test: string[]; mods: string[]; tags?: string[] };
type Group = { exceptions?: Rule[]; suffixes: Rule[] };
const TABLE = rules as unknown as Record<"lastname" | "firstname" | "middlename", Group>;
const MOD: Record<Exclude<NameCase, "nominative">, number> = { genitive: 0, dative: 1, accusative: 2 };
const HYPHENS = /([-‐‑])/;
const PART = /^[а-яёА-ЯЁ]+(?:[-‐‑][а-яёА-ЯЁ]+)*$/;
const FEMALE = ["овна", "евна", "ична", "кызы", "кизи", "гызы", "кзы"];
const MALE = ["ич", "оглы", "улы", "уулу", "углы", "угли"];

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** "ИВАНОВА" and "иванова" become "Иванова"; mixed case is taken as the author wrote it. */
function normalizePart(word: string) {
  const parts = word.split(HYPHENS);
  for (let i = 0; i < parts.length; i += 2) {
    const part = parts[i];
    if (part && (part === part.toUpperCase() || part === part.toLowerCase())) parts[i] = capital(part.toLowerCase());
  }
  return parts.join("");
}

function inflect(value: string, group: keyof typeof TABLE, gender: string, mod: number) {
  const table = TABLE[group];
  const parts = value.split(HYPHENS);
  for (let i = 0; i < parts.length; i += 2) {
    const word = parts[i].toLowerCase();
    const firstWord = i === 0 && parts.length > 1;
    const applicable = (rule: Rule) => (rule.gender === gender || rule.gender === "androgynous") && (rule.tags?.every((tag) => tag === "first_word" && firstWord) ?? true);
    // Petrovich: the first applicable whole-word exception, then the first applicable suffix, in table order.
    const rule = table.exceptions?.find((r) => applicable(r) && r.test.includes(word)) ?? table.suffixes.find((r) => applicable(r) && r.test.some((suffix) => word.endsWith(suffix)));
    if (!rule || rule.mods[mod] === ".") continue;
    const replacement = rule.mods[mod].replace(/^-+/, "");
    const trim = rule.mods[mod].length - replacement.length;
    parts[i] = parts[i].slice(0, parts[i].length - trim) + replacement;
    if (trim === word.length && parts[i]) parts[i] = capital(parts[i]);
  }
  return parts.join("");
}

/** Declines "Фамилия Имя Отчество". The gender comes from the patronymic; without one the name is refused, not guessed. */
export function fullName(name: string, form: NameCase = "nominative") {
  const parts = name.normalize().split(/\s+/).filter(Boolean).map(normalizePart);
  if (form === "nominative") return parts.join(" ");
  const patronymic = parts.length === 3 ? parts[2].toLowerCase() : "";
  const gender = FEMALE.some((s) => patronymic.endsWith(s)) ? "female" : MALE.some((s) => patronymic.endsWith(s)) ? "male" : null;
  if (!gender || parts.some((part) => !PART.test(part))) throw new Error(`Не удалось склонить ФИО «${parts.join(" ")}». Проверьте, что фамилия, имя и отчество указаны полностью на русском языке.`);
  return [inflect(parts[0], "lastname", gender, MOD[form]), inflect(parts[1], "firstname", gender, MOD[form]), inflect(parts[2], "middlename", gender, MOD[form])].join(" ");
}

/** "Соколовой М. А." */
export function initials(name: string, form: NameCase = "nominative") {
  const parts = fullName(name, form).split(" ");
  return parts.length < 2 ? parts.join(" ") : `${parts[0]} ${parts.slice(1).map((p) => `${p.charAt(0).toUpperCase()}.`).join(" ")}`;
}

const UNITS = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
const GROUPS = [[], ["тысяча", "тысячи", "тысяч"], ["миллион", "миллиона", "миллионов"], ["миллиард", "миллиарда", "миллиардов"]];

export const plural = (value: number, forms: readonly string[]) => forms[value % 100 >= 11 && value % 100 <= 14 ? 2 : value % 10 === 1 ? 0 : value % 10 >= 2 && value % 10 <= 4 ? 1 : 2];

function triple(value: number, feminine: boolean) {
  const last = value % 100;
  const units = last < 20 ? last : last % 10;
  const unit = feminine && (units === 1 || units === 2) ? (units === 1 ? "одна" : "две") : UNITS[units];
  return [HUNDREDS[Math.floor(value / 100)], TENS[last < 20 ? 0 : Math.floor(last / 10)], unit].filter(Boolean).join(" ");
}

/** 12 350 → "двенадцать тысяч триста пятьдесят рублей 00 копеек". */
export function amountWords(amount: number) {
  const cents = Math.round(Math.abs(amount) * 100);
  const rubles = Math.floor(cents / 100), kopecks = cents % 100;
  const parts: string[] = [];
  // The index advances even across empty groups of three digits.
  for (let rest = rubles, index = 0; rest > 0; rest = Math.floor(rest / 1000), index++) {
    const value = rest % 1000;
    parts.push(value === 0 ? "" : triple(value, index === 1) + (index === 0 ? "" : ` ${plural(value, GROUPS[index])}`));
  }
  const text = rubles === 0 ? "ноль" : parts.reverse().filter(Boolean).join(" ");
  return `${amount < 0 ? "минус " : ""}${text} ${plural(rubles % 100, ["рубль", "рубля", "рублей"])} ${String(kopecks).padStart(2, "0")} ${plural(kopecks, ["копейка", "копейки", "копеек"])}`;
}

export const rub = (value: number) => `${Math.round(value).toLocaleString("ru-RU").replace(/ | /g, " ")} руб.`;

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export const MONTH_NAMES = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

/** Dates are plain UTC days: a document date never shifts with the reader's time zone. */
export const day = (year: number, month: number, date: number) => new Date(Date.UTC(year, month - 1, date));
export const longDate = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} г.`;
export const shortDate = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
