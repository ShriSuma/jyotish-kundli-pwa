import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import { calculateKundli } from "../core/KundliEngine";
import { computeDoshaLifeReport } from "../core/DoshaLifeEngine";
import { generateKundliReading } from "../core/KundliReadingEngine";
import {
  buildHousePredictions,
  generateDashaCautions,
  netScoreToPercent,
  percentToStars
} from "../core/HousePredictionEngine";

describe("HousePredictionEngine", () => {
  const birth = {
    birthDate: "1993-05-31",
    birthTime: "09:25",
    latitude: 14.5478,
    longitude: 74.3188
  };

  it("maps net score to percent and stars", () => {
    expect(netScoreToPercent(0)).toBe(50);
    expect(netScoreToPercent(3)).toBeGreaterThan(70);
    expect(percentToStars(80)).toBe(4);
  });

  it("builds 12 human house predictions without placeholders", async () => {
    await i18n.changeLanguage("en");
    const k = calculateKundli({ name: "Test", ...birth });
    const report = computeDoshaLifeReport(k, birth);
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), report);

    expect(reading.housePredictions).toHaveLength(12);
    for (const hp of reading.housePredictions) {
      expect(hp.prediction).not.toMatch(/\{\{/);
      expect(hp.prediction).not.toContain("undefined");
      expect(hp.score).toBeGreaterThanOrEqual(15);
      expect(hp.score).toBeLessThanOrEqual(95);
      expect(hp.stars).toBeGreaterThanOrEqual(1);
      expect(hp.prediction.length).toBeGreaterThan(40);
    }
  });

  it("lists dasha caution ages with danger hints", async () => {
    await i18n.changeLanguage("en");
    const k = calculateKundli({ name: "Test", ...birth });
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), computeDoshaLifeReport(k, birth));

    expect(reading.dashaCautionLines.length).toBeGreaterThan(0);
    expect(reading.dashaCautionLines[0]).toMatch(/Ages \d/);
    expect(reading.dashaCautionLines.join(" ")).not.toContain("undefined");
  });

  it("buildHousePredictions works standalone", async () => {
    await i18n.changeLanguage("en");
    const k = calculateKundli({ name: "Test", ...birth });
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), computeDoshaLifeReport(k, birth));
    const preds = buildHousePredictions(k, reading.houses, i18n.t.bind(i18n), "en");
    expect(preds).toHaveLength(12);

    const cautions = generateDashaCautions(k, 32, i18n.t.bind(i18n));
    expect(cautions.length).toBeGreaterThan(0);
    expect(cautions.some((c) => c.dangerHints.length > 0)).toBe(true);
  });
});
