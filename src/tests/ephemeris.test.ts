import { describe, expect, it } from "vitest";
import { calculateKundli } from "../core/KundliEngine";
import { siderealLongitudes } from "../core/EphemerisEngine";
import { spicaTropicalEclipticLongitude, trueChitrapakshaAyanamsaDegrees } from "../core/DrikGanitaAyanamsa";
import { wallClockBirthToUtc } from "../core/birthTime";
import { normalizeDegree } from "../core/AstroMath";

describe("Ephemeris / sidereal pipeline", () => {
  it("sidereal Sun and Moon are in valid ranges for J2000 noon UTC", () => {
    const d = new Date("2000-01-01T12:00:00Z");
    const L = siderealLongitudes(d);
    expect(L.sun).toBeGreaterThanOrEqual(0);
    expect(L.sun).toBeLessThan(360);
    expect(L.moon).toBeGreaterThanOrEqual(0);
    expect(L.moon).toBeLessThan(360);
    expect(L.ayanamsa).toBeGreaterThan(22);
    expect(L.ayanamsa).toBeLessThan(26);
  });

  it("Bangalore birth uses IST wall clock for UTC instant", () => {
    const utc = wallClockBirthToUtc("1995-08-16", "10:30", 12.97, 77.59);
    expect(utc.toISOString()).toContain("1995-08-16T05:00:00.000Z");
  });

  it("KundliEngine returns nine planets and lagna in range", () => {
    const k = calculateKundli({
      name: "T",
      birthDate: "1995-08-16",
      birthTime: "10:30",
      latitude: 12.9716,
      longitude: 77.5946
    });
    expect(k.planets).toHaveLength(9);
    expect(k.ascendant).toBeGreaterThanOrEqual(0);
    expect(k.ascendant).toBeLessThan(360);
  });

  it("Drik Gaṇita (True Chitrā) keeps Spica sidereal near 180°", () => {
    const d = new Date("2020-06-21T12:00:00Z");
    const trop = spicaTropicalEclipticLongitude(d);
    const ayan = trueChitrapakshaAyanamsaDegrees(d);
    const sid = normalizeDegree(trop - ayan);
    expect(sid).toBeCloseTo(180, 0);
  });

  it("Rahu and Ketu are 180° apart (sidereal)", () => {
    const d = new Date("2010-06-15T08:00:00Z");
    const L = siderealLongitudes(d);
    const sep = Math.abs(normalizeDegree(L.ketu - L.rahu));
    expect(Math.min(sep, 360 - sep)).toBeCloseTo(180, 5);
  });
});
