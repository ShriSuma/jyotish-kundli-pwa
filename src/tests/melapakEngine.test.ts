import { describe, expect, it } from "vitest";
import { computeMelapak, rajjuDosha, vedhaDosha } from "../core/MelapakEngine";

describe("MelapakEngine", () => {
  it("flags Ashwini + Magha as Rajju dosha (same pada line, both aroha)", () => {
    expect(rajjuDosha(0, 9)).toBe(true);
  });

  it("does not flag Rajju for Ashwini + Bharani", () => {
    expect(rajjuDosha(0, 1)).toBe(false);
  });

  it("flags Ashwini + Jyeshtha as Vedha", () => {
    expect(vedhaDosha(0, 17)).toBe(true);
  });

  it("returns a bounded Ashta Kuta total", () => {
    const r = computeMelapak(0, 1, 0, 5);
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeLessThanOrEqual(36);
    expect(r.kutas).toHaveLength(8);
  });
});
