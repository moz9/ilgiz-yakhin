import { describe, expect, it } from "vitest";
import { FLEET, latest, outcome, summary, SYSTEMS, unconfirmed, verdict, type Attempt, type Phase } from "./fleet";

const run = (targets: number[], attempt: number): Attempt => ({ at: "09:00", targets, results: Object.fromEntries(targets.map((id) => [id, outcome(id, attempt)])) });

describe("fleet notices", () => {
  it("has 24 invented workstations, some without an assigned person", () => {
    expect(FLEET).toHaveLength(24);
    expect(new Set(FLEET.map((p) => p.name)).size).toBe(24);
    expect(FLEET.some((p) => p.assigned === null)).toBe(true);
    expect(FLEET.some((p) => p.os === "Windows 7")).toBe(true);
  });

  it("counts a shown window separately from a confirmed one", () => {
    const results: Record<number, Phase> = { 0: "ack", 1: "closed", 2: "timeout", 3: "rpc", 4: "noreceiver", 5: "sending" };
    expect(summary(results, [0, 1, 2, 3, 4, 5])).toEqual({ targets: 6, shown: 3, ack: 1, closed: 1, timeout: 1, failed: 2, pending: 1 });
  });

  it("sends the reminder only to machines nobody confirmed in any attempt", () => {
    const first = run(FLEET.map((p) => p.id), 0);
    const left = unconfirmed([first]);
    expect(left.length).toBeGreaterThan(0);
    expect(left.every((id) => first.results[id] !== "ack")).toBe(true);
    const second = run(left, 1);
    const after = unconfirmed([first, second]);
    expect(after.length).toBeLessThan(left.length);
    expect(after.every((id) => left.includes(id) && second.results[id] !== "ack")).toBe(true);
    expect(latest([first, second])[left[0]]).toBe(second.results[left[0]]);
  });

  it("is the same run on every visit", () => {
    expect(FLEET.map((p) => outcome(p.id, 0))).toEqual(FLEET.map((p) => outcome(p.id, 0)));
  });
});

describe("backup register", () => {
  it("trusts only a fresh job with a tested restore", () => {
    expect(verdict({ copy: 0, job: 0, restore: 12 })).toBe("proven");
    expect(verdict({ copy: 0, job: 0, restore: null })).toBe("untested");
    expect(verdict({ copy: 0, job: 0, restore: 200 })).toBe("untested");
    expect(verdict({ copy: 1, job: 9, restore: 5 })).toBe("stale");
    expect(verdict({ copy: null, job: null, restore: null })).toBe("missing");
  });

  it("starts with every status represented", () => {
    expect(new Set(SYSTEMS.map(verdict))).toEqual(new Set(["proven", "untested", "stale", "missing"]));
  });
});
