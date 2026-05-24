import { describe, expect, it } from "vitest";
import { calculateKundli } from "../core/KundliEngine";
import {
  computeDoshaLifeReport,
  detectGuruChandal,
  detectSarpaDosha,
  houseFromSign,
  kalaSarpaType
} from "../core/DoshaLifeEngine";

describe("DoshaLifeEngine", () => {
  it("houseFromSign counts whole-sign houses", () => {
    expect(houseFromSign(0, 5)).toBe(6);
    expect(houseFromSign(5, 5)).toBe(1);
  });

  it("Gokarna 1993 chart produces a report with longevity band", () => {
    const k = calculateKundli({
      name: "Test",
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: 14.5478,
      longitude: 74.3188
    });
    const report = computeDoshaLifeReport(k, {
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: 14.5478,
      longitude: 74.3188
    });
    expect(report.longevity.midYears).toBeGreaterThan(50);
    expect(report.longevity.highYears).toBeGreaterThan(report.longevity.lowYears);
    expect(report.insights.yogas).toBeDefined();
  });

  it("kala sarpa type maps Rahu house when full", () => {
    const k = calculateKundli({
      name: "Test",
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: 14.5478,
      longitude: 74.3188
    });
    const rahuHouse = k.planets.find((p) => p.name === "Rahu")?.house ?? 1;
    const type = kalaSarpaType(k, "full");
    expect(type).toBeTruthy();
    if (type) {
      const expected = [
        "anant",
        "kulik",
        "vasuki",
        "shankhpal",
        "padma",
        "mahapadma",
        "takshak",
        "karkotak",
        "shankhachud",
        "ghatak",
        "vishdhar",
        "sheshnag"
      ][rahuHouse - 1];
      expect(type).toBe(expected);
    }
  });

  it("detectSarpaDosha returns hits only for 6/7/8 from refs", () => {
    const k = calculateKundli({
      name: "Test",
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: 14.5478,
      longitude: 74.3188
    });
    const hits = detectSarpaDosha(k);
    hits.forEach((h) => {
      expect([6, 7, 8]).toContain(h.house);
    });
  });

  it("detectGuruChandal is boolean", () => {
    const k = calculateKundli({
      name: "Test",
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: 14.5478,
      longitude: 74.3188
    });
    expect(typeof detectGuruChandal(k)).toBe("boolean");
  });
});
