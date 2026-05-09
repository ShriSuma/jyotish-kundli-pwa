import { beforeEach, describe, expect, it } from "vitest";
import { calculateKundli } from "../core/KundliEngine";
import {
  db,
  getAnalyticsEventCounts,
  getPanchangCache,
  getPredictionCache,
  getSettings,
  saveAnalyticsEvent,
  saveKundli,
  getKundlis,
  savePanchangCache,
  savePredictionCache,
  saveSettings
} from "../db/indexedDb";

describe("IndexedDB persistence", () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.kundlis.clear();
    await db.panchangCache.clear();
    await db.predictionCache.clear();
    await db.scheduledNotifications.clear();
    await db.analyticsEvents.clear();
    await saveSettings({ language: "en", analyticsEnabled: false });
  });

  it("save and retrieve Kundli", async () => {
    const input = {
      name: "A",
      birthDate: "1992-11-10",
      birthTime: "04:10",
      latitude: 19.07,
      longitude: 72.87
    };
    const output = calculateKundli(input);
    await saveKundli(input, output);
    const rows = await getKundlis();
    expect(rows.length).toBe(1);
    expect(rows[0].moonSign.english).toBeTruthy();
  });

  it("panchang cache hit and miss", async () => {
    expect(await getPanchangCache("2026-05-10", "19,72")).toBeNull();
    await savePanchangCache("2026-05-10", "19,72", {
      tithi: "Test",
      nakshatra: "Ashwini",
      yoga: "Siddha",
      karana: "Bava",
      paksha: "Shukla",
      sunrise: "06:10",
      sunset: "18:45",
      moonrise: "07:00"
    });
    expect((await getPanchangCache("2026-05-10", "19,72"))?.tithi).toBe("Test");
  });

  it("prediction cache with expiry", async () => {
    await savePredictionCache("k1", "daily", "2026-05-10", "en", {
      title: "T",
      summary: "S",
      career: "C",
      finance: "F",
      health: "H",
      relationships: "R",
      lucky: { color: "Blue", number: 2, direction: "East" },
      rating: 4
    });
    const row = await getPredictionCache("k1", "daily", "2026-05-10", "en");
    expect(row?.title).toBe("T");
  });

  it("analytics saved only when consent enabled", async () => {
    await saveAnalyticsEvent("app_loaded", {});
    expect(await getAnalyticsEventCounts()).toEqual({});
    await saveSettings({ language: "en", analyticsEnabled: true });
    await saveAnalyticsEvent("app_loaded", {});
    expect((await getAnalyticsEventCounts()).app_loaded).toBe(1);
  });

  it("persists default location fields on settings", async () => {
    await saveSettings({
      language: "en",
      defaultLat: 12.97,
      defaultLng: 77.59,
      placeLabel: "Bengaluru",
      pincode: "560001"
    });
    const s = await getSettings();
    expect(s?.defaultLat).toBeCloseTo(12.97);
    expect(s?.defaultLng).toBeCloseTo(77.59);
    expect(s?.placeLabel).toBe("Bengaluru");
    expect(s?.pincode).toBe("560001");
  });
});

