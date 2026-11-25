import { describe, expect, it } from "vitest";
import { brokenWeek, parse, total, validate, WEEK } from "./visitors";

describe("visitor week", () => {
  it("passes the control week: 28 980 entries, totals equal the entrances", () => {
    expect(total(WEEK)).toBe(28980);
    expect(validate(WEEK)).toEqual([]);
    expect(WEEK[5].weekday).toBe("сб");
  });

  it("finds the missing counter, the repeated day and the hand-typed total", () => {
    const issues = validate(brokenWeek()).map((i) => `${i.date} ${i.text}`);
    expect(issues).toContain("2026-07-14 день пришёл в выгрузке дважды");
    expect(issues.some((i) => i.startsWith("2026-07-16 нет показаний"))).toBe(true);
    expect(issues.some((i) => i.startsWith("2026-07-18 итог дня 5187"))).toBe(true);
    expect(issues).toHaveLength(3);
  });

  it("notices a gap in dates and rejects files that are not a week", () => {
    expect(validate([WEEK[0], WEEK[3]]).map((i) => i.text)).toContain("пропущено дней перед этой датой: 2");
    expect(parse("{")).toEqual({ error: "Файл не читается как JSON." });
    expect(parse("[]")).toHaveProperty("error");
    expect(parse(JSON.stringify(WEEK))).toHaveProperty("days");
  });
});
