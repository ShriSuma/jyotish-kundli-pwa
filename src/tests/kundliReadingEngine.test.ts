import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import { calculateKundli } from "../core/KundliEngine";
import { computeDoshaLifeReport } from "../core/DoshaLifeEngine";
import { generateKundliReading } from "../core/KundliReadingEngine";

describe("KundliReadingEngine", () => {
  const birth = {
    birthDate: "1993-05-31",
    birthTime: "09:25",
    latitude: 14.5478,
    longitude: 74.3188
  };

  it("produces chart-specific lines without undefined placeholders (English)", async () => {
    await i18n.changeLanguage("en");
    const k = calculateKundli({ name: "Test", ...birth });
    const report = computeDoshaLifeReport(k, birth);
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), report);

    expect(reading.intro).toMatch(/chart|Kundli|whole-sign/i);
    expect(reading.ageLine).toMatch(/\d+\.\d/);
    expect(reading.dashaLine).not.toContain("undefined");
    expect(reading.dashaLine).not.toContain("not computed");
    expect(reading.lagnaLine).toMatch(/Lagna is/);
    expect(reading.houses).toHaveLength(12);
  });

  it("produces Kannada reading with filled age and dasha", async () => {
    await i18n.changeLanguage("kn");
    const k = calculateKundli({ name: "Test", ...birth });
    const report = computeDoshaLifeReport(k, birth);
    const reading = generateKundliReading(k, birth, i18n.t.bind(i18n), report);

    expect(reading.ageLine).toMatch(/\d+/);
    expect(reading.dashaLine).not.toContain("undefined");
    expect(reading.dashaLine).not.toMatch(/\{\{/);
    expect(reading.intro).toContain("ಕುಂಡಲಿ");
  });
});
