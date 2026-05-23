import { describe, expect, it } from "vitest";
import {
  formatNavamsaPada,
  formatPatrikaAmshaOnly,
  patrikaAmshaFromDegree,
  formatRashiAmsha,
  formatRashiBhaaga,
  navamsaPadaFromDegree,
  rashiAmshaFromDegree
} from "../core/localeNumbers";

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

  it("formats degrees and whole minutes within sign", () => {
    expect(formatRashiBhaaga(10.2, "en")).toBe("10°12′");
    expect(formatRashiBhaaga(0, "en")).toBe("0°0′");
    expect(formatRashiBhaaga(29.99, "en")).toBe("29°59′");
  });

  it("maps degree-in-sign to navāṁśa pada 1–9 (3°20′ each)", () => {
    expect(navamsaPadaFromDegree(0)).toBe(1);
    expect(navamsaPadaFromDegree(3.32)).toBe(1);
    expect(navamsaPadaFromDegree(3.34)).toBe(2);
    expect(navamsaPadaFromDegree(150 + 21.2167)).toBe(7);
    expect(navamsaPadaFromDegree(90 + 9.3)).toBe(3);
    expect(formatNavamsaPada(150 + 21.2167, "en")).toBe("7");
  });

  it("formats patrikā chart bracket as navāṁśa rāśi 1–12", () => {
    expect(formatPatrikaAmshaOnly(0.6, "en")).toBe("(1)");
    expect(formatPatrikaAmshaOnly(30 + 15.95, "en")).toBe("(2)");
  });
});
