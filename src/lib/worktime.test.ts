import { describe, expect, it } from "vitest";
import { clock, computeDay, computeWeek, dayKey, hours, sampleEvents, type AccessEvent } from "./worktime";

const day = (events: [number, "in" | "out"][]): AccessEvent[] => events.map(([minute, direction]) => ({ person: 0, day: 0, minute, direction }));

describe("working-time rules", () => {
  it("pairs entries with exits and counts overtime in whole half-hours", () => {
    const result = computeDay(day([[540, "in"], [780, "out"], [820, "in"], [1150, "out"]]), 0, 0);
    expect(result.intervals).toEqual([{ from: 540, to: 780 }, { from: 820, to: 1150 }]);
    // 4 h + 5 h 30 min = 9 h 30 min: 1 h 30 min over the norm, all of it in whole half-hours.
    expect([result.worked, result.overtime, result.credited, result.late]).toEqual([570, 90, 90, 0]);
    expect(computeDay(day([[540, "in"], [1065, "out"]]), 0, 0).credited).toBe(30); // 8 h 45 min: 45 over, 30 counted
  });

  it("forgives five minutes and reports lateness from 9:00", () => {
    expect(computeDay(day([[545, "in"], [1080, "out"]]), 0, 0).late).toBe(0);
    expect(computeDay(day([[552, "in"], [1080, "out"]]), 0, 0).late).toBe(12);
  });

  it("drops a double read and holds back a day without an exit", () => {
    const twice = computeDay(day([[540, "in"], [541, "in"], [1080, "out"]]), 0, 0);
    expect([twice.duplicates, twice.worked]).toEqual([1, 540]);
    const open = day([[540, "in"], [780, "out"], [820, "in"]]);
    expect(computeDay(open, 0, 0)).toMatchObject({ issue: true, worked: 0 });
    expect(computeDay(open, 0, 0, "close")).toMatchObject({ issue: false, worked: 240 + 260 });
    expect(computeDay(open, 0, 0, "skip")).toMatchObject({ issue: false, skipped: true, worked: 0 });
  });

  it("builds the sample week with one open day and one double read", () => {
    const events = sampleEvents();
    const week = computeWeek(events);
    expect([week.issues, week.duplicates]).toEqual([1, 1]);
    expect(week.days.find((d) => d.issue)).toMatchObject({ person: 3, day: 2 });
    const closed = computeWeek(events, { [dayKey(3, 2)]: "close" });
    expect(closed.issues).toBe(0);
    expect(closed.worked).toBeGreaterThan(week.worked);
  });

  it("formats time", () => {
    expect([clock(545), hours(495), hours(480)]).toEqual(["09:05", "8 ч 15 мин", "8 ч"]);
  });
});
