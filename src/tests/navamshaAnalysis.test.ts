import { describe, expect, it } from "vitest";
import { calculateKundliWithPlaceSun } from "../core/KundliEngine";
import { PlanetName } from "../core/AstroTypes";
import { navamsaSignIndex, navamsaLongitude } from "../core/Navamsa";
import {
  navamsaPadaFromDegree,
  rashiAmshaFromDegree,
  patrikaAmshaFromDegree,
  degreeInSign
} from "../core/localeNumbers";

const INPUT = {
  name: "Pramod",
  birthDate: "1993-05-31",
  birthTime: "09:25",
  latitude: 14.5479,
  longitude: 74.3187,
  pincode: "581326"
};

/** Handwritten navāṁśa brackets from user image. */
const PAPER_NAV = {
  Lagna: 4,
  Venus: 1,
  Sun: 2,
  Ketu: 3,
  Mercury: 7,
  Mars: 10,
  Moon: 3,
  Jupiter: 1,
  Maandi: 6,
  Rahu: 9,
  Saturn: 8
};

describe("navamsha analysis", () => {
  it("prints all bracket conventions vs paper", async () => {
    const k = await calculateKundliWithPlaceSun(INPUT, { ayanamsaModel: "lahiri" });
    const pos = (n: PlanetName) => k.planets.find((p) => p.name === n)!;
    const lagnaNavSign = navamsaSignIndex(k.ascendant);

    const rows: string[] = [];
    const check = (label: string, deg: number, paper?: number) => {
      const ins = degreeInSign(deg);
      const navL = navamsaLongitude(deg);
      const navSign = navamsaSignIndex(deg);
      const houseFromNavLagna = ((navSign - lagnaNavSign + 12) % 12) + 1;
      rows.push(
        `${label.padEnd(8)} paper=${String(paper).padStart(2)} | inSign=${ins.toFixed(2).padStart(6)} navPada=${navamsaPadaFromDegree(deg)} d12=${rashiAmshaFromDegree(deg)} whole=${patrikaAmshaFromDegree(deg)} navSign=${navSign + 1} navHouse=${houseFromNavLagna} navPadaD9=${navamsaPadaFromDegree(navL)}`
      );
    };

    check("Lagna", k.ascendant, PAPER_NAV.Lagna);
    for (const n of [
      PlanetName.Venus,
      PlanetName.Sun,
      PlanetName.Ketu,
      PlanetName.Mercury,
      PlanetName.Mars,
      PlanetName.Moon,
      PlanetName.Jupiter,
      PlanetName.Saturn,
      PlanetName.Rahu
    ]) {
      check(n, pos(n).degree, PAPER_NAV[n as keyof typeof PAPER_NAV]);
    }
    if (k.maandi) check("Maandi", k.maandi.degree, PAPER_NAV.Maandi);

    // eslint-disable-next-line no-console
    console.log("\n" + rows.join("\n") + "\n");
    expect(true).toBe(true);
  });
});
