import { describe, expect, it } from "vitest";
import { calculateKundliWithPlaceSun } from "../core/KundliEngine";
import { PlanetName } from "../core/AstroTypes";
import { patrikaNavamshaFromDegree, navamsaPadaFromDegree, degreeInSign } from "../core/localeNumbers";
import { vimshottariBalanceAtBirth, vimshottariBalanceYmdPatrika, vimshottariBalanceYmdSavana } from "../core/DashaBhuktiEngine";

const INPUT = {
  name: "Pramod",
  birthDate: "1993-05-31",
  birthTime: "09:25",
  latitude: 14.5479,
  longitude: 74.3187,
  pincode: "581326"
};

/** Handwritten patrikā (Pramod, 31-05-1993 09:25 Gokarna). */
const PAPER_AMSHA: Record<string, number> = {
  Venus: 11,
  Sun: 16,
  Ketu: 2,
  Mercury: 7,
  Lagna: 4,
  Mars: 10,
  Moon: 17,
  Jupiter: 11,
  Maandi: 9,
  Rahu: 2,
  Saturn: 8
};

describe("Gokarna verification report", () => {
  it("prints comparison vs handwritten patrikā (Lahiri)", async () => {
    const k = await calculateKundliWithPlaceSun(INPUT, { ayanamsaModel: "lahiri" });
    const dasha = vimshottariBalanceAtBirth(k);
    const ymd = vimshottariBalanceYmdPatrika(dasha.balanceYears);

    const rows: string[] = [];
    rows.push("\n=== Gokarna 1993-05-31 09:25 IST (Lahiri) ===\n");
    rows.push(
      `Dasha: app ${dasha.lord} ${ymd.y}y ${ymd.m}m ${ymd.d}d | paper Moon 4y 0m 7d | match: ${
        dasha.lord === PlanetName.Moon && ymd.y === 4 && ymd.m === 0 && ymd.d >= 2 && ymd.d <= 8 ? "≈YES" : "NO"
      }`
    );
    rows.push(`Sunrise: ${k.birthSunTimes?.sunrise} | Sunset: ${k.birthSunTimes?.sunset} (${k.birthSunTimes?.source})`);
    rows.push(`Moon nakṣatra pada (center): ${k.moonPada}\n`);
    rows.push("Graha          | Paper | App amsha | ° in sign | Nav pada | Match");
    rows.push("---------------|-------|-----------|-----------|----------|------");

    const check = (label: string, degree: number, paper?: number) => {
      const app = patrikaNavamshaFromDegree(degree);
      const ins = degreeInSign(degree).toFixed(2);
      const nav = navamsaPadaFromDegree(degree);
      const match = paper === undefined ? "—" : app === paper || nav === paper ? "≈nav" : "NO";
      rows.push(
        `${label.padEnd(14)} | ${String(paper ?? "—").padStart(5)} | ${String(app).padStart(9)} | ${ins.padStart(9)} | ${String(nav).padStart(8)} | ${match}`
      );
    };

    const pos = (n: PlanetName) => k.planets.find((p) => p.name === n)!;
    check("Lagna", k.ascendant, PAPER_AMSHA.Lagna);
    for (const n of [
      PlanetName.Sun,
      PlanetName.Moon,
      PlanetName.Mars,
      PlanetName.Mercury,
      PlanetName.Jupiter,
      PlanetName.Venus,
      PlanetName.Saturn,
      PlanetName.Rahu,
      PlanetName.Ketu
    ]) {
      const p = pos(n);
      check(n, p.degree, PAPER_AMSHA[n]);
    }
    if (k.maandi) check("Maandi", k.maandi.degree, PAPER_AMSHA.Maandi);

    // eslint-disable-next-line no-console
    console.log(rows.join("\n"));

    expect(dasha.lord).toBe(PlanetName.Moon);
    expect(ymd.y).toBe(4);
    expect(ymd.m).toBe(0);
  });

  it("prints Drik Gaṇita delta (default app setting)", async () => {
    const k = await calculateKundliWithPlaceSun(INPUT, { ayanamsaModel: "drik_ganita" });
    const ymd = vimshottariBalanceYmdSavana(vimshottariBalanceAtBirth(k).balanceYears);
    // eslint-disable-next-line no-console
    console.log(`\n[Drik Gaṇita default] Dasha YMD: ${ymd.y}y ${ymd.m}m ${ymd.d}d (use Lahiri in Settings to match paper)\n`);
    expect(true).toBe(true);
  });
});
