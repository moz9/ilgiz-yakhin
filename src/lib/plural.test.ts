import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("picks the Russian noun form for a count", () => {
    const form = (n: number) => `${n} ${plural(n, "проект", "проекта", "проектов")}`;
    expect([1, 2, 4, 5, 11, 12, 14, 21, 22, 24, 25, 100, 101, 111, 112].map(form)).toEqual([
      "1 проект", "2 проекта", "4 проекта", "5 проектов", "11 проектов", "12 проектов", "14 проектов", "21 проект", "22 проекта", "24 проекта", "25 проектов",
      "100 проектов", "101 проект", "111 проектов", "112 проектов",
    ]);
  });
});
