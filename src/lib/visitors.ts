/**
 * A week of people counters and the checks that run before the numbers reach the report
 * template. The control week is demonstration data; the rules are the ones the case describes:
 * nothing is written while a counter is missing, a day repeats or the day's total disagrees with
 * its entrances.
 */

export const COUNTERS = [
  { key: "lower_level_entry", label: "Вход с нижнего уровня", short: "Вход −1", entry: true },
  { key: "ground_floor_entry", label: "Вход с первого этажа", short: "Вход 1", entry: true },
  { key: "level_2_flow", label: "Поток на 2 этаже", short: "2 этаж", entry: false },
  { key: "level_3_flow", label: "Поток на 3 этаже", short: "3 этаж", entry: false },
  { key: "level_4_flow", label: "Поток на 4 этаже", short: "4 этаж", entry: false },
] as const;
export type CounterKey = (typeof COUNTERS)[number]["key"];
export type Day = { date: string; weekday: string; total: number; values: Partial<Record<CounterKey, number>> };

const W = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const row = (date: string, v: number[]): Day => {
  const values = Object.fromEntries(COUNTERS.map((c, i) => [c.key, v[i]])) as Record<CounterKey, number>;
  return { date, weekday: W[new Date(`${date}T12:00:00Z`).getUTCDay()], total: v[0] + v[1], values };
};

/** The control week: 28 980 entries, Saturday the busiest day. */
export const WEEK: Day[] = [
  row("2026-07-13", [438, 3156, 1824, 1442, 1138]),
  row("2026-07-14", [447, 3242, 1886, 1497, 1172]),
  row("2026-07-15", [462, 3308, 1934, 1538, 1205]),
  row("2026-07-16", [469, 3371, 1976, 1574, 1237]),
  row("2026-07-17", [503, 3618, 2143, 1698, 1324]),
  row("2026-07-18", [648, 4439, 2687, 2164, 1688]),
  row("2026-07-19", [625, 4254, 2548, 2051, 1596]),
];

/** The same week as a real export arrives: a counter dropped out, a day came twice, a total was typed by hand. */
export function brokenWeek(): Day[] {
  const days = WEEK.map((d) => ({ ...d, values: { ...d.values } }));
  delete days[3].values.level_3_flow;
  days[5] = { ...days[5], total: days[5].total + 100 };
  days.splice(2, 0, { ...days[1], values: { ...days[1].values } });
  return days;
}

export type Issue = { date: string; text: string; counter?: CounterKey };

export function validate(days: Day[]): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const day of days) {
    if (seen.has(day.date)) issues.push({ date: day.date, text: "день пришёл в выгрузке дважды" });
    seen.add(day.date);
    for (const c of COUNTERS) {
      const v = day.values[c.key];
      if (v === undefined || v === null) issues.push({ date: day.date, counter: c.key, text: `нет показаний: ${c.label.toLowerCase()}` });
      else if (!Number.isInteger(v) || v < 0) issues.push({ date: day.date, counter: c.key, text: `недопустимое значение ${v}: ${c.label.toLowerCase()}` });
    }
    const entries = (day.values.lower_level_entry ?? 0) + (day.values.ground_floor_entry ?? 0);
    if (day.values.lower_level_entry !== undefined && day.values.ground_floor_entry !== undefined && entries !== day.total) {
      issues.push({ date: day.date, text: `итог дня ${day.total} не равен сумме входов ${entries}` });
    }
  }
  const dates = [...seen].sort();
  for (let i = 1; i < dates.length; i++) {
    const gap = (Date.parse(dates[i]) - Date.parse(dates[i - 1])) / 86400000;
    if (gap > 1) issues.push({ date: dates[i], text: `пропущено дней перед этой датой: ${gap - 1}` });
  }
  return issues;
}

/** Reads an uploaded export; anything that is not a list of days is rejected with a reason. */
export function parse(text: string): { days: Day[] } | { error: string } {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data) || !data.length) return { error: "Ожидается JSON-массив дней, как в образце." };
    const days = data.map((d) => ({ date: String(d.date ?? ""), weekday: String(d.weekday ?? ""), total: Number(d.total), values: d.values ?? {} }));
    if (days.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d.date))) return { error: "У каждого дня должна быть дата в формате ГГГГ-ММ-ДД." };
    return { days };
  } catch {
    return { error: "Файл не читается как JSON." };
  }
}

export const total = (days: Day[]) => days.reduce((sum, d) => sum + d.total, 0);
export const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });

export async function sha256Hex(bytes: Uint8Array | string) {
  const data = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
