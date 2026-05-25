import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import { calculateKundli } from "../core/KundliEngine";
import { computeDoshaLifeReport } from "../core/DoshaLifeEngine";
import { generateKundliReading } from "../core/KundliReadingEngine";
import { composeHouseNarrative } from "../core/PersonalizedNarrativeEngine";
import { houseForSign } from "../components/kundli/southIndianLayout";

describe("PersonalizedNarrativeEngine", () => {
  const birth = {
    birthDate: "1993-05-31",
    birthTime: "09:25",
    latitude: 14.5478,
    longitude: 74.3188
  };

  it("uses distinct opening lines per bhāva in Kannada", async () => {
    await i18n.changeLanguage("kn");
    const k = calculateKundli({ name: "Test", ...birth });
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), computeDoshaLifeReport(k, birth), "kn");
    const openings = reading.houses.map((h) => composeHouseNarrative(k, h, i18n.t.bind(i18n), "kn").slice(0, 24));
    const unique = new Set(openings);
    expect(unique.size).toBeGreaterThan(8);
  });

  it("includes navamsha amsha in English predictions", async () => {
    await i18n.changeLanguage("en");
    const k = calculateKundli({ name: "Test", ...birth });
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), computeDoshaLifeReport(k, birth), "en");
    const withGraha = reading.housePredictions.filter((p) => /navāṁśa amsha|navamsha amsha/i.test(p.prediction));
    expect(withGraha.length).toBeGreaterThan(0);
    const texts = reading.housePredictions.map((p) => p.prediction);
    expect(new Set(texts).size).toBe(12);
  });
});

describe("Karka lagna house order (clockwise)", () => {
  const karka = 3;
  it("maps signs to bhāvas 1–12 from Lagna", () => {
    expect(houseForSign(karka, 3)).toBe(1);
    expect(houseForSign(karka, 4)).toBe(2);
    expect(houseForSign(karka, 5)).toBe(3);
    expect(houseForSign(karka, 6)).toBe(4);
    expect(houseForSign(karka, 7)).toBe(5);
    expect(houseForSign(karka, 8)).toBe(6);
    expect(houseForSign(karka, 9)).toBe(7);
    expect(houseForSign(karka, 10)).toBe(8);
    expect(houseForSign(karka, 11)).toBe(9);
    expect(houseForSign(karka, 0)).toBe(10);
    expect(houseForSign(karka, 1)).toBe(11);
    expect(houseForSign(karka, 2)).toBe(12);
  });
});
