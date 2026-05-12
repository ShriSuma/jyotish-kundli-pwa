import { describe, expect, it } from "vitest";
import { formatRashiAmsha, rashiAmshaFromDegree } from "../core/localeNumbers";

describe("localeNumbers rashi amsha", () => {
  it("maps degree-in-sign to dwādaśāṁśa index 1–12", () => {
    expect(rashiAmshaFromDegree(0)).toBe(1);
    expect(rashiAmshaFromDegree(2.4)).toBe(1);
    expect(rashiAmshaFromDegree(2.5)).toBe(2);
    expect(rashiAmshaFromDegree(29.9)).toBe(12);
    expect(rashiAmshaFromDegree(45)).toBe(7);
  });

  it("formats with ASCII for English", () => {
    expect(formatRashiAmsha(10.2, "en")).toBe("5");
  });
});
