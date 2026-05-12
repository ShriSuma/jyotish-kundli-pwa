import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import { calculateKundli } from "../core/KundliEngine";
import { calculatePanchang } from "../core/PanchangEngine";
import { calculateRahuKaal } from "../core/RahuKaalEngine";
import { getDailyPrediction } from "../core/PredictionEngine";

describe("Astrology engines", () => {
  it("KundliEngine returns ascendant in expected range", () => {
    const kundli = calculateKundli({
      name: "Test",
      birthDate: "1995-08-16",
      birthTime: "10:30",
      latitude: 12.9716,
      longitude: 77.5946
    });
    expect(kundli.ascendant).toBeGreaterThanOrEqual(0);
    expect(kundli.ascendant).toBeLessThan(360);
  });

  it("PanchangEngine returns known structure", () => {
    const anchor = new Date("2026-05-10T12:00:00+05:30");
    const p = calculatePanchang(anchor, 19.076, 72.8777, { locale: "en-IN" });
    expect(p.tithi.length).toBeGreaterThan(0);
    expect(p.nakshatra.length).toBeGreaterThan(0);
  });

  it("Panchang sunrise for Gokarna uses IST morning hours, not viewer default TZ", () => {
    const anchor = new Date("2026-05-12T12:00:00+05:30");
    const p = calculatePanchang(anchor, 14.55, 74.32, { locale: "en-IN" });
    const [h] = p.sunrise.split(":").map(Number);
    expect(h).toBeGreaterThanOrEqual(4);
    expect(h).toBeLessThanOrEqual(9);
  });

  it("RahuKaalEngine Monday uses segment 2", () => {
    const date = new Date("2026-05-11T09:00:00");
    const sunrise = new Date("2026-05-11T06:00:00");
    const sunset = new Date("2026-05-11T18:00:00");
    const r = calculateRahuKaal(date, sunrise, sunset);
    expect(r.startTime).toContain("07");
  });

  it("PredictionEngine is deterministic", async () => {
    await i18n.changeLanguage("en");
    const kundli = calculateKundli({
      name: "Test",
      birthDate: "1990-01-01",
      birthTime: "06:00",
      latitude: 19.076,
      longitude: 72.8777
    });
    const d1 = getDailyPrediction(kundli, new Date("2026-05-09T00:00:00Z"), i18n.t.bind(i18n), "Test");
    const d2 = getDailyPrediction(kundli, new Date("2026-05-09T00:00:00Z"), i18n.t.bind(i18n), "Test");
    expect(d1).toEqual(d2);
  });
});

