import { describe, expect, it } from "vitest";
import { formatRashiAmsha, rashiAmshaFromDegree } from "../core/localeNumbers";

describe("localeNumbers rashi amsha", () => {
  it("maps degree-in-sign to 1–30", () => {
    expect(rashiAmshaFromDegree(0)).toBe(1);
    expect(rashiAmshaFromDegree(0.5)).toBe(1);
    expect(rashiAmshaFromDegree(29.9)).toBe(30);
    expect(rashiAmshaFromDegree(45)).toBe(16);
  });

  it("formats with ASCII for English", () => {
    expect(formatRashiAmsha(10.2, "en")).toBe("11");
  });
});
