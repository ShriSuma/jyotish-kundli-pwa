import { describe, expect, it } from "vitest";
import { calculateKundli } from "../core/KundliEngine";
import { PlanetName } from "../core/AstroTypes";
import { rashiAmshaFromDegree } from "../core/localeNumbers";
import { vimshottariBalanceAtBirth } from "../core/DashaBhuktiEngine";

/** Gokarna area (PIN 581326). */
const GOKARNA = { lat: 14.5479, lng: 74.3187, pin: "581326" };

/**
 * Handwritten patrikā (31-05-1993, 09:25 IST) matches several whole-sign placements
 * under this app’s Lahiri model; Sun/Moon/Mars/Jupiter/Rahu/Ketu amsha numbers on paper
 * differ from ephemeris for the same civil date — see patrikaNote in locales.
 */
describe("Gokarna 1993-05-31 09:25 IST (Lahiri)", () => {
  it("agrees with patrikā on shared graha signs and key amshas", () => {
    const k = calculateKundli({
      name: "Pramod",
      birthDate: "1993-05-31",
      birthTime: "09:25",
      latitude: GOKARNA.lat,
      longitude: GOKARNA.lng,
      pincode: GOKARNA.pin
    });
    const pos = (n: PlanetName) => k.planets.find((p) => p.name === n)!;

    expect(k.lagnaRashi.sanskrit).toBe("Karka");
    expect(pos(PlanetName.Venus).rashi.sanskrit).toBe("Mesha");
    expect(rashiAmshaFromDegree(pos(PlanetName.Venus).degree)).toBe(1);
    expect(pos(PlanetName.Mercury).rashi.sanskrit).toBe("Mithuna");
    expect(rashiAmshaFromDegree(pos(PlanetName.Mercury).degree)).toBe(3);
    expect(pos(PlanetName.Saturn).rashi.sanskrit).toBe("Kumbha");
    expect([7, 8]).toContain(rashiAmshaFromDegree(pos(PlanetName.Saturn).degree));
    expect(pos(PlanetName.Moon).rashi.sanskrit).toBe("Kanya");
    expect(pos(PlanetName.Jupiter).rashi.sanskrit).toBe("Kanya");
    expect(pos(PlanetName.Rahu).rashi.sanskrit).toBe("Vrischika");
    expect(pos(PlanetName.Ketu).rashi.sanskrit).toBe("Vrishabha");

    expect(k.maandi?.rashi.sanskrit).toBe("Kanya");
    expect(rashiAmshaFromDegree(k.maandi!.degree)).toBeGreaterThanOrEqual(9);
    expect(rashiAmshaFromDegree(k.maandi!.degree)).toBeLessThanOrEqual(11);

    const dasha = vimshottariBalanceAtBirth(k);
    expect(dasha.lord).toBe(PlanetName.Moon);
  });
});
