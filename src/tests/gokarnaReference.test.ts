import { describe, expect, it } from "vitest";

import { calculateKundliWithPlaceSun } from "../core/KundliEngine";

import { PlanetName } from "../core/AstroTypes";

import { patrikaNavamshaFromDegree, patrikaMaandiBracket } from "../core/localeNumbers";

import { vimshottariBalanceAtBirth, vimshottariBalanceYmdPatrika } from "../core/DashaBhuktiEngine";

/** Gokarna (PIN 581326) — handwritten patrikā 31-05-1993 09:25 IST. */
const input = {
  name: "Pramod",
  birthDate: "1993-05-31",
  birthTime: "09:25",
  latitude: 14.5479,
  longitude: 74.3187,
  pincode: "581326"
};

describe("Gokarna 1993-05-31 09:25 IST (Lahiri, patrikā style)", () => {
  it("matches handwritten Moon dasha balance and navāṁśa chart brackets", async () => {
    const k = await calculateKundliWithPlaceSun(input, { ayanamsaModel: "lahiri" });

    const pos = (n: PlanetName) => k.planets.find((p) => p.name === n)!;

    const dasha = vimshottariBalanceAtBirth(k);
    expect(dasha.lord).toBe(PlanetName.Moon);

    const ymd = vimshottariBalanceYmdPatrika(dasha.balanceYears);
    expect(ymd.y).toBe(4);
    expect(ymd.m).toBe(0);
    expect(ymd.d).toBeGreaterThanOrEqual(3);
    expect(ymd.d).toBeLessThanOrEqual(6);

    expect(k.birthSunTimes?.sunrise).toMatch(/^06:0[3-5]$/);

    expect(k.lagnaRashi.sanskrit).toBe("Karka");
    expect(pos(PlanetName.Moon).rashi.sanskrit).toBe("Kanya");
    expect(pos(PlanetName.Moon).nakshatra.sanskrit).toBe("Hasta");
    expect(pos(PlanetName.Sun).rashi.sanskrit).toBe("Vrishabha");

    expect(patrikaNavamshaFromDegree(pos(PlanetName.Venus).degree)).toBe(1);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Sun).degree)).toBe(2);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Ketu).degree)).toBe(3);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Mercury).degree)).toBe(7);
    expect(patrikaNavamshaFromDegree(k.ascendant)).toBe(4);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Mars).degree)).toBe(10);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Moon).degree)).toBe(3);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Jupiter).degree)).toBe(1);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Rahu).degree)).toBe(9);
    expect(patrikaNavamshaFromDegree(pos(PlanetName.Saturn).degree)).toBe(8);
    if (k.maandi) expect(patrikaMaandiBracket(k.maandi.rashi.index)).toBe(6);
  });
});
