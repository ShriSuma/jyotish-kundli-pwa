import { describe, expect, it } from "vitest";
import { computeMaandi } from "../core/MaandiEngine";

describe("MaandiEngine", () => {
  it("returns degree in range and a non-empty window label", () => {
    const birth = new Date("2026-05-09T14:00:00");
    const m = computeMaandi(birth, 19.076, 72.8777);
    expect(m.degree).toBeGreaterThanOrEqual(0);
    expect(m.degree).toBeLessThan(360);
    expect(m.windowLabel.length).toBeGreaterThan(3);
    expect(m.rashi.index).toBeGreaterThanOrEqual(0);
    expect(m.rashi.index).toBeLessThanOrEqual(11);
  });
});
