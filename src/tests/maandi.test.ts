import { describe, expect, it } from "vitest";
import { sunTimesSyncForBirth } from "../core/birthSunTimes";
import { computeMaandi } from "../core/MaandiEngine";
import { rashiAmshaFromDegree } from "../core/localeNumbers";

describe("MaandiEngine", () => {
  it("Gokarna morning birth — Maandi in Kanyā (early Gulika segment)", () => {
    const birth = new Date("1993-05-31T09:25:00+05:30");
    const sun = sunTimesSyncForBirth(birth, 14.5479, 74.3187, "581326");
    const m = computeMaandi(birth, 14.5479, 74.3187, "581326", "lahiri", sun);
    expect(m.rashi.sanskrit).toBe("Kanya");
    expect(rashiAmshaFromDegree(m.degree)).toBeGreaterThanOrEqual(3);
    expect(rashiAmshaFromDegree(m.degree)).toBeLessThanOrEqual(5);
  });

  it("returns degree in range and a non-empty window label", () => {
    const birth = new Date("2026-05-09T14:00:00");
    const sun = sunTimesSyncForBirth(birth, 19.076, 72.8777, "");
    const m = computeMaandi(birth, 19.076, 72.8777, "", "lahiri", sun);
    expect(m.degree).toBeGreaterThanOrEqual(0);
    expect(m.degree).toBeLessThan(360);
    expect(m.windowLabel.length).toBeGreaterThan(3);
    expect(m.rashi.index).toBeGreaterThanOrEqual(0);
    expect(m.rashi.index).toBeLessThanOrEqual(11);
  });
});
