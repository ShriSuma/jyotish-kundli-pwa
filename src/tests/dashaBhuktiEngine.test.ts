import { describe, expect, it } from "vitest";
import { PlanetName, type KundliOutput } from "../core/AstroTypes";
import { degreeToNakshatra, degreeToRashi, normalizeDegree } from "../core/AstroMath";
import { calculateKundli } from "../core/KundliEngine";
import {
  generateBhuktisInMahadasha,
  generateDashaTimeline,
  vimshottariBalanceAtBirth,
  vimshottariBalanceYmdPatrika,
  vimshottariBalanceYmdSavana
} from "../core/DashaBhuktiEngine";

const NAK = 360 / 27;

const kundliWithMoonOnly = (moonDegree: number): KundliOutput => {
  const md = normalizeDegree(moonDegree);
  return {
    ascendant: md,
    planets: [
      {
        name: PlanetName.Moon,
        degree: md,
        rashi: degreeToRashi(md),
        nakshatra: degreeToNakshatra(md),
        house: 1
      }
    ],
    houses: Array.from({ length: 12 }, (_, i) => normalizeDegree(md + i * 30)),
    moonSign: degreeToRashi(md),
    sunSign: degreeToRashi(md),
    lagnaRashi: degreeToRashi(md),
    moonPada: 1
  };
};

describe("DashaBhuktiEngine scaled antardashas", () => {
  it("antardasha lengths inside a partial mahadasha sum to the actual mahadasha span", () => {
    const subs = generateBhuktisInMahadasha(PlanetName.Ketu, 1.25);
    const sum = subs.reduce((a, b) => a + b.years, 0);
    expect(sum).toBeCloseTo(1.25, 5);
    expect(subs[0]!.planet).toBe(PlanetName.Ketu);
  });

  it("full mahadasha antardashas still sum to full years when no override is passed", () => {
    const subs = generateBhuktisInMahadasha(PlanetName.Venus);
    const sum = subs.reduce((a, b) => a + b.years, 0);
    expect(sum).toBeCloseTo(20, 5);
  });

  it("first timeline mahadasha bhukti partition matches its durationYears", () => {
    const k = calculateKundli(
      {
        name: "T",
        birthDate: "1995-08-16",
        birthTime: "10:30",
        latitude: 12.9716,
        longitude: 77.5946
      },
      { ayanamsaModel: "lahiri" }
    );
    const timeline = generateDashaTimeline(k, 40);
    const first = timeline[0]!;
    const subs = generateBhuktisInMahadasha(first.planet, first.durationYears);
    const sum = subs.reduce((a, b) => a + b.years, 0);
    expect(sum).toBeCloseTo(first.durationYears, 4);
    const bal = vimshottariBalanceAtBirth(k);
    expect(first.planet).toBe(bal.lord);
    expect(first.durationYears).toBeCloseTo(bal.balanceYears, 4);
  });

  it("Vimśottari birth balance uses full lord years × (1 − nakṣatra progress)", () => {
    const rohiniStart = 3 * NAK;
    const b = vimshottariBalanceAtBirth(kundliWithMoonOnly(rohiniStart + 1e-6));
    expect(b.lord).toBe(PlanetName.Moon);
    expect(b.balanceYears).toBeCloseTo(10, 4);

    const midHasta = 12 * NAK + 0.5 * NAK;
    const bh = vimshottariBalanceAtBirth(kundliWithMoonOnly(midHasta));
    expect(bh.lord).toBe(PlanetName.Moon);
    expect(bh.balanceYears).toBeCloseTo(5, 4);
  });
});

describe("vimshottariBalanceYmdPatrika", () => {
  it("maps decimal balance to savana y/m/d (patrikā style)", () => {
    expect(vimshottariBalanceYmdPatrika(0)).toEqual({ y: 0, m: 0, d: 0 });
    expect(vimshottariBalanceYmdPatrika(4 + 7 / 360)).toEqual({ y: 4, m: 0, d: 7 });
    expect(vimshottariBalanceYmdPatrika(4 + 3 / 360)).toEqual({ y: 4, m: 0, d: 3 });
  });
});

describe("vimshottariBalanceYmdSavana", () => {
  it("maps decimal balance to 360-day savana y/m/d (12×30)", () => {
    expect(vimshottariBalanceYmdSavana(0)).toEqual({ y: 0, m: 0, d: 0 });
    expect(vimshottariBalanceYmdSavana(4 + 3 / 360)).toEqual({ y: 4, m: 0, d: 3 });
    expect(vimshottariBalanceYmdSavana(183 / 360)).toEqual({ y: 0, m: 6, d: 3 });
  });
});
