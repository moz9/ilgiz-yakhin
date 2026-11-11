/**
 * From a raw export of door events to a checked working-time report. The events and the
 * people are generated; the rules are plain demonstration rules, stated in the interface:
 * a day's norm is 8 hours, work starts at 9:00, overtime counts in whole half-hours.
 */
export type AccessEvent = { person: number; day: number; minute: number; direction: "in" | "out" };
export type Decision = "close" | "skip";
export type Interval = { from: number; to: number; open?: boolean };
export type DayResult = {
  person: number; day: number; intervals: Interval[]; duplicates: number;
  worked: number; late: number; overtime: number; credited: number;
  /** A day with an entry and no exit cannot be counted until a person decides what it was. */
  issue: boolean; skipped: boolean;
};

export const NORM = 480, START = 9 * 60, GRACE = 5, SHIFT_END = 18 * 60, HALF = 30;
export const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт"] as const;
export const PEOPLE = ["Соколова М. А.", "Кузнецов А. И.", "Гарипова А. Р.", "Назаров Д. С.", "Мельник Т. Ю.", "Белова О. В.", "Орлов П. Н.", "Юсупова Л. Ф."] as const;

/** A small seeded generator: the same week on every visit and in every test. */
function random(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

export function sampleEvents(): AccessEvent[] {
  const rnd = random(20261011), events: AccessEvent[] = [];
  const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
  PEOPLE.forEach((_, person) => {
    for (let day = 0; day < DAYS.length; day++) {
      if (rnd() < 0.07) continue; // a day off
      const arrive = rnd() < 0.2 ? between(9 * 60 + 8, 9 * 60 + 40) : between(8 * 60 + 40, 9 * 60 + 3);
      const lunch = between(12 * 60 + 50, 13 * 60 + 25), back = lunch + between(32, 58);
      const leave = rnd() < 0.3 ? between(18 * 60 + 40, 20 * 60 + 10) : between(17 * 60 + 58, 18 * 60 + 20);
      events.push({ person, day, minute: arrive, direction: "in" }, { person, day, minute: lunch, direction: "out" }, { person, day, minute: back, direction: "in" }, { person, day, minute: leave, direction: "out" });
    }
  });
  // Two faults every real export has: a forgotten badge on the way out and a double read at the door.
  const lost = events.findIndex((e) => e.person === 3 && e.day === 2 && e.direction === "out" && e.minute > 15 * 60);
  if (lost >= 0) events.splice(lost, 1);
  const twice = events.find((e) => e.person === 5 && e.direction === "in");
  if (twice) events.push({ ...twice, minute: twice.minute + 1 });
  return events.sort((a, b) => a.day - b.day || a.minute - b.minute || a.person - b.person);
}

/** One person's day: pairs entries with exits, drops double reads, and applies the rules. */
export function computeDay(events: AccessEvent[], person: number, day: number, decision?: Decision): DayResult {
  const own = events.filter((e) => e.person === person && e.day === day).sort((a, b) => a.minute - b.minute);
  const clean: AccessEvent[] = [];
  let duplicates = 0;
  for (const event of own) {
    const previous = clean.at(-1);
    // The same direction again within two minutes is the reader firing twice.
    if (previous && previous.direction === event.direction && event.minute - previous.minute <= 2) { duplicates++; continue; }
    clean.push(event);
  }
  const intervals: Interval[] = [];
  let entered: number | null = null;
  for (const event of clean) {
    if (event.direction === "in") entered ??= event.minute;
    else if (entered !== null) { intervals.push({ from: entered, to: event.minute }); entered = null; }
  }
  let issue = false;
  if (entered !== null) {
    if (decision === "close") intervals.push({ from: entered, to: Math.max(entered, SHIFT_END) });
    else { issue = decision !== "skip"; intervals.push({ from: entered, to: Math.max(entered + 30, SHIFT_END), open: true }); }
  }
  const skipped = decision === "skip" && entered !== null;
  const counted = issue || skipped ? [] : intervals;
  const worked = counted.reduce((sum, i) => sum + i.to - i.from, 0);
  const first = intervals[0]?.from ?? null;
  const late = !issue && !skipped && first !== null && first > START + GRACE ? first - START : 0;
  const overtime = Math.max(0, worked - NORM);
  return { person, day, intervals, duplicates, worked, late, overtime, credited: Math.floor(overtime / HALF) * HALF, issue, skipped };
}

export type Decisions = Record<string, Decision | undefined>;
export const dayKey = (person: number, day: number) => `${person}:${day}`;

export function computeWeek(events: AccessEvent[], decisions: Decisions = {}) {
  const days = PEOPLE.flatMap((_, person) => DAYS.map((__, day) => computeDay(events, person, day, decisions[dayKey(person, day)])));
  const people = PEOPLE.map((name, person) => {
    const own = days.filter((d) => d.person === person);
    return {
      person, name, days: own,
      shifts: own.filter((d) => d.worked > 0).length,
      worked: own.reduce((a, d) => a + d.worked, 0), credited: own.reduce((a, d) => a + d.credited, 0),
      late: own.filter((d) => d.late > 0).length, issues: own.filter((d) => d.issue).length,
    };
  });
  return {
    days, people,
    worked: people.reduce((a, p) => a + p.worked, 0), credited: people.reduce((a, p) => a + p.credited, 0),
    late: people.reduce((a, p) => a + p.late, 0), issues: people.reduce((a, p) => a + p.issues, 0),
    duplicates: days.reduce((a, d) => a + d.duplicates, 0),
  };
}

export const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
/** 495 → "8 ч 15 мин". */
export const hours = (minutes: number) => (minutes % 60 ? `${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : `${minutes / 60} ч`);
