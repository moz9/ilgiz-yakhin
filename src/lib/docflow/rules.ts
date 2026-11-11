import { amountWords, day, fullName, initials, longDate, MONTH_NAMES, plural, rub, shortDate } from "./text";

/**
 * From a timesheet of extra hours to a set of personnel documents. The rules are a
 * TypeScript port of the calculation core of a working desktop product: match the short
 * name in the sheet to a person, check every row, compute the extra pay, pick document
 * dates, and only then write the orders. A row with a remark produces no document.
 */
export const REASONS = ["вакантная должность", "отпуск", "больничный", "неполная ставка"] as const;
export type Reason = (typeof REASONS)[number];

export type Person = { code: string; name: string; position: string; contractNumber: string; contractDate: string };
/** One timesheet row: who, their salary and monthly norm, hours by day of the month. */
export type Row = {
  id: string; name: string; personCode: string;
  salary: number | null; normHours: number | null;
  reason: string; replaced: string;
  marks: Record<number, number>;
  /** The "hours" total as the sheet states it; null when the sheet has no such column. */
  reported: number | null;
};
export type IssueKind = "person" | "total" | "reason" | "replaced" | "salary" | "norm" | "hours" | "negative" | "profile";
export type Issue = { id: string; rowId: string; kind: IssueKind; text: string; candidates?: Person[]; sum?: number };
export type Award = { person: Person; rows: Row[]; hours: number; amount: number; from: Date; to: Date; documentDate: Date; reason: Reason; replaced: string };
export type Evaluation = { issues: Issue[]; awards: Award[]; total: number };

/** Upper case, "Ё" as "Е", single spaces: the form names are compared in. */
export const key = (s: string) => s.toUpperCase().replace(/Ё/g, "Е").split(/\s+/).filter(Boolean).join(" ");

/** "Соколова М.А." matches "Соколова Марина Андреевна": the surname whole, the rest by first letters. */
export function nameMatches(shortName: string, name: string) {
  const a = key(shortName).replace(/\./g, " ").split(" ").filter(Boolean);
  const b = key(name).split(" ");
  return a.length >= 2 && b.length >= a.length && a.every((x, i) => (i === 0 ? x === b[i] : b[i].startsWith(x)));
}

/** A row belongs to a person when it was assigned by hand or exactly one person fits the name. */
export function personOf(row: Row, people: Person[]) {
  const chosen = people.find((p) => p.code === row.personCode);
  if (chosen) return { person: chosen, candidates: [] as Person[] };
  const candidates = people.filter((p) => nameMatches(row.name, p.name));
  return { person: candidates.length === 1 ? candidates[0] : null, candidates };
}

export const sumHours = (row: Row) => Object.values(row.marks).reduce((a, h) => a + (h > 0 ? h : 0), 0);
const daysOf = (row: Row) => Object.entries(row.marks).filter(([, h]) => h > 0).map(([d]) => Number(d)).sort((a, b) => a - b);

/** A document is never dated on a weekend: Saturday and Sunday fall back to Friday. */
export function onOrBeforeWeekday(date: Date) {
  const weekday = date.getUTCDay();
  return new Date(date.getTime() - (weekday === 6 ? 1 : weekday === 0 ? 2 : 0) * 86400000);
}
/** The order is signed on the last working day before the extra work starts. */
export const previousWeekday = (start: Date) => onOrBeforeWeekday(new Date(start.getTime() - 86400000));
export function monthEnd(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0));
}

export function evaluate(rows: Row[], people: Person[], month: string): Evaluation {
  const [year, monthNumber] = month.split("-").map(Number);
  const issues: Issue[] = [];
  const add = (row: Row, kind: IssueKind, text: string, extra: Partial<Issue> = {}) => issues.push({ id: `${row.id}:${kind}`, rowId: row.id, kind, text: `${row.name}: ${text}`, ...extra });
  const owners = new Map<string, Person>();

  for (const row of rows) {
    const { person, candidates } = personOf(row, people);
    if (!person) add(row, "person", candidates.length > 1 ? `в кадровых сведениях ${candidates.length} ${plural(candidates.length, ["подходящий сотрудник", "подходящих сотрудника", "подходящих сотрудников"])} — выберите нужного.` : "сотрудник не найден в кадровых сведениях — выберите его.", { candidates: candidates.length ? candidates : people });
    else {
      owners.set(row.id, person);
      if (!person.position || !person.contractNumber || !person.contractDate) add(row, "profile", "в кадровых сведениях нет должности или реквизитов трудового договора.");
    }
    const sum = sumHours(row);
    if (!(row.salary && row.salary > 0)) add(row, "salary", "укажите оклад.");
    if (!(row.normHours && row.normHours > 0)) add(row, "norm", "не указана норма часов за месяц.");
    if (Object.values(row.marks).some((h) => h < 0)) add(row, "negative", "в отметках есть отрицательные часы. Недоработки не вычитаются из доплаты автоматически.");
    else if (sum <= 0) add(row, "hours", "нет часов переработки.");
    else if (row.reported !== null && row.reported !== sum) add(row, "total", `сумма часов по датам (${sum}) не совпадает с итогом в табеле (${row.reported}).`, { sum });
    if (!REASONS.includes(row.reason as Reason)) add(row, "reason", "выберите основание совмещения.");
    else if (row.reason !== "вакантная должность" && !row.replaced.trim()) add(row, "replaced", "укажите, за кого выполнялась работа.");
  }

  // One person may have several rows; a remark on any of them holds back that person's documents.
  const flagged = new Set(issues.map((issue) => issue.rowId));
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const person = owners.get(row.id);
    if (person) groups.set(person.code, [...(groups.get(person.code) ?? []), row]);
  }
  const awards: Award[] = [];
  for (const [code, group] of groups) {
    if (group.some((row) => flagged.has(row.id))) continue;
    const person = people.find((p) => p.code === code)!;
    const days = group.flatMap(daysOf);
    const raw = group.reduce((a, row) => a + (row.salary! / row.normHours!) * sumHours(row), 0);
    const from = day(year, monthNumber, Math.min(...days)), to = day(year, monthNumber, Math.max(...days));
    awards.push({
      person, rows: group, hours: group.reduce((a, row) => a + sumHours(row), 0),
      // Extra pay is rounded to fifty rubles, halves up.
      amount: Math.round(raw / 50) * 50,
      from, to, documentDate: previousWeekday(from), reason: group[0].reason as Reason, replaced: group[0].replaced.trim(),
    });
  }
  awards.sort((a, b) => a.person.name.localeCompare(b.person.name, "ru") || a.person.code.localeCompare(b.person.code));
  return { issues, awards, total: awards.reduce((a, award) => a + award.amount, 0) };
}

export type Block = { text: string; align?: "center" | "right" | "justify"; bold?: boolean; gap?: boolean; indent?: boolean };
export type DocumentKind = "order" | "agreement" | "payroll";
export type Doc = { id: string; kind: DocumentKind; file: string; title: string; subtitle: string; blocks: Block[] };
export type Organization = { name: string; city: string; head: string; headPosition: string; headPositionGenitive: string };

/** A replaced person may be typed as a full name or as initials; a full name is declined, anything else is kept as written. */
function replacedGenitive(name: string) {
  try { return initials(name, "genitive"); } catch { return name; }
}
function ground(award: Award) {
  switch (award.reason) {
    case "вакантная должность": return "в связи с наличием вакантной должности";
    case "отпуск": return `на период отпуска ${replacedGenitive(award.replaced)}`;
    case "больничный": return `на период временной нетрудоспособности ${replacedGenitive(award.replaced)}`;
    default: return `в связи с работой ${replacedGenitive(award.replaced)} на условиях неполной ставки`;
  }
}

/** Two documents per person and one payroll order for the month, numbered in name order. */
export function buildDocuments(evaluation: Evaluation, month: string, org: Organization, firstNumber = 41): Doc[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const docs: Doc[] = [];
  const head: Block[] = [{ text: org.name, align: "center", bold: true }, { text: "Демонстрационный документ на вымышленных данных", align: "center", gap: true }];
  const sign: Block[] = [{ text: `${org.headPosition} ____________________ ${initials(org.head)}`, gap: true }];
  evaluation.awards.forEach((award, index) => {
    const { person } = award;
    const number = `${firstNumber + index}-к`;
    const contract = `трудовому договору № ${person.contractNumber} от ${shortDate(new Date(`${person.contractDate}T00:00:00Z`))}`;
    const period = `с ${longDate(award.from)} по ${longDate(award.to)}`;
    const sum = `${rub(award.amount)} (${amountWords(award.amount)})`;
    docs.push({
      id: `order:${person.code}`, kind: "order", file: `Приказ ${number} ${initials(person.name)}.docx`, title: `Приказ № ${number}`, subtitle: initials(person.name),
      blocks: [...head,
        { text: `ПРИКАЗ № ${number}`, align: "center", bold: true },
        { text: `${org.city}, ${longDate(award.documentDate)}`, align: "center", gap: true },
        { text: "О поручении дополнительной работы", bold: true, gap: true },
        { text: `На основании статей 60.2 и 151 Трудового кодекса Российской Федерации, ${ground(award)}`, indent: true, align: "justify", gap: true },
        { text: "ПРИКАЗЫВАЮ:", bold: true },
        { text: `1. Поручить ${fullName(person.name, "dative")} (${person.position}) ${period} выполнение дополнительной работы в течение установленной продолжительности рабочего дня наряду с работой, определённой трудовым договором.`, indent: true, align: "justify" },
        { text: `2. Установить ${initials(person.name, "dative")} доплату за ${award.hours} ч дополнительной работы в размере ${sum}.`, indent: true, align: "justify" },
        { text: `3. Основание: дополнительное соглашение от ${shortDate(award.documentDate)} к ${contract}, табель учёта дополнительной работы за ${MONTH_NAMES[monthNumber - 1]} ${year} г.`, indent: true, align: "justify", gap: true },
        ...sign,
        { text: `С приказом ознакомлен(а): ____________________ ${initials(person.name)}` },
      ],
    });
    docs.push({
      id: `agreement:${person.code}`, kind: "agreement", file: `Допсоглашение ${initials(person.name)}.docx`, title: "Дополнительное соглашение", subtitle: initials(person.name),
      blocks: [...head,
        { text: "ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ", align: "center", bold: true },
        { text: `к ${contract}`, align: "center" },
        { text: `${org.city}, ${longDate(award.documentDate)}`, align: "center", gap: true },
        { text: `${org.name} в лице ${org.headPositionGenitive} ${fullName(org.head, "genitive")}, именуемое в дальнейшем «Работодатель», и ${fullName(person.name)}, именуемый(ая) в дальнейшем «Работник», заключили настоящее соглашение о нижеследующем:`, indent: true, align: "justify", gap: true },
        { text: `1. Работнику с его письменного согласия ${period} поручается дополнительная работа ${ground(award)} без освобождения от работы, определённой трудовым договором.`, indent: true, align: "justify" },
        { text: `2. За выполнение дополнительной работы Работнику устанавливается доплата в размере ${sum}.`, indent: true, align: "justify" },
        { text: "3. Остальные условия трудового договора остаются неизменными. Соглашение составлено в двух экземплярах, по одному для каждой из сторон.", indent: true, align: "justify", gap: true },
        { text: `Работодатель: ____________________ ${initials(org.head)}` },
        { text: `Работник: ____________________ ${initials(person.name)}` },
      ],
    });
  });
  if (evaluation.awards.length) {
    const date = onOrBeforeWeekday(monthEnd(month));
    const number = `${firstNumber + evaluation.awards.length}-к`;
    docs.push({
      id: "payroll", kind: "payroll", file: `Приказ ${number} о выплате.docx`, title: `Приказ № ${number}`, subtitle: "О выплате доплат",
      blocks: [...head,
        { text: `ПРИКАЗ № ${number}`, align: "center", bold: true },
        { text: `${org.city}, ${longDate(date)}`, align: "center", gap: true },
        { text: `О выплате доплат за ${MONTH_NAMES[monthNumber - 1]} ${year} г.`, bold: true, gap: true },
        { text: "ПРИКАЗЫВАЮ:", bold: true },
        { text: "1. Выплатить доплату за дополнительную работу следующим работникам:", indent: true },
        ...evaluation.awards.map((award, i): Block => ({ text: `${i + 1}) ${initials(award.person.name, "dative")}, ${award.person.position} — ${rub(award.amount)}`, indent: true })),
        { text: `2. Общая сумма выплат: ${rub(evaluation.total)} (${amountWords(evaluation.total)}).`, indent: true, align: "justify", gap: true },
        ...sign,
      ],
    });
  }
  return docs;
}
