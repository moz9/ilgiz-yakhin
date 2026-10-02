import { describe, expect, it } from "vitest";
import { DEFAULT_GLASS_DENSITY, edgeRefraction, normalizeGlassDensity, roundedDistance } from "./glass-optics";

describe("glass geometry and preferences", () => {
  it("validates stored density without accepting strings or non-finite numbers", () => {
    for (const value of [null, undefined, NaN, Infinity, "90", {}]) expect(normalizeGlassDensity(value)).toBe(DEFAULT_GLASS_DENSITY);
    expect(normalizeGlassDensity(-20)).toBe(0);
    expect(normalizeGlassDensity(120)).toBe(100);
    expect(normalizeGlassDensity(36)).toBe(36);
  });
  it("has a neutral center and strongest displacement at the rim", () => {
    expect(edgeRefraction(0)).toBeCloseTo(1);
    expect(edgeRefraction(1)).toBe(0);
    const samples = Array.from({ length: 101 }, (_, index) => edgeRefraction(index / 100));
    samples.forEach((sample, index) => {
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
      if (index) expect(sample).toBeLessThanOrEqual(samples[index - 1]);
    });
  });
  it("matches rounded geometry and is symmetric", () => {
    expect(roundedDistance(0, 0, 200, 60, 30)).toBe(-30);
    expect(roundedDistance(100, 0, 200, 60, 30)).toBe(0);
    expect(roundedDistance(100, 30, 200, 60, 30)).toBeGreaterThan(0);
    expect(roundedDistance(82, 12, 200, 60, 30)).toBe(roundedDistance(-82, -12, 200, 60, 30));
  });
});
