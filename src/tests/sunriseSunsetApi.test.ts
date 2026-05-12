import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applySunTimesToPanchang, fetchSunriseSunsetUtc } from "../core/sunriseSunsetApi";

describe("sunriseSunsetApi", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          status: "OK",
          results: {
            sunrise: "2026-05-12T00:34:45+00:00",
            sunset: "2026-05-12T13:23:25+00:00"
          }
        })
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchSunriseSunsetUtc parses UTC ISO from API", async () => {
    const r = await fetchSunriseSunsetUtc(14.55, 74.32, "2026-05-12");
    expect(r).not.toBeNull();
    expect(r!.sunrise.toISOString()).toBe("2026-05-12T00:34:45.000Z");
    expect(r!.sunset.toISOString()).toBe("2026-05-12T13:23:25.000Z");
  });

  it("applySunTimesToPanchang formats IST labels for India", () => {
    const base = {
      tithi: "T",
      nakshatra: "N",
      yoga: "Y",
      karana: "K",
      paksha: "Krishna" as const,
      sunrise: "wrong",
      sunset: "wrong",
      moonrise: "--:--"
    };
    const merged = applySunTimesToPanchang(
      base,
      { sunrise: new Date("2026-05-12T00:34:45+00:00"), sunset: new Date("2026-05-12T13:23:25+00:00") },
      "en-IN",
      14.55,
      74.32,
      "581326"
    );
    expect(merged.sunrise).toMatch(/06:0/);
    expect(merged.sunset).toMatch(/18:5/);
  });
});
