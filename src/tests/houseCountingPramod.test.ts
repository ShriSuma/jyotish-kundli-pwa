import { describe, expect, it } from "vitest";
import { calculateKundliWithPlaceSun } from "../core/KundliEngine";
import { PlanetName } from "../core/AstroTypes";

/** Pramod, 1993-05-31 09:25 Gokarna — handwritten paper places: Lagna+Mars in Karka,
 *  Moon/Jupiter/Maandi in Kanya (3rd), Rahu in Vrischika (5th), Saturn in Kumbha (8th),
 *  Venus in Mesha (10th), Sun+Ketu in Vrishabha (11th), Mercury in Mithuna (12th).
 *  This test prints the app's house numbers per planet so we can spot offset bugs.
 */
describe("Pramod chart — house numbers vs handwritten paper", () => {
  it("prints app's planet→house map", async () => {
    const k = await calculateKundliWithPlaceSun(
      {
        name: "Pramod",
        birthDate: "1993-05-31",
        birthTime: "09:25",
        latitude: 14.5479,
        longitude: 74.3187,
        pincode: "581326"
      },
      { ayanamsaModel: "lahiri" }
    );

    const paperHouse: Partial<Record<PlanetName, number>> = {
      [PlanetName.Mars]: 1,
      [PlanetName.Moon]: 3,
      [PlanetName.Jupiter]: 3,
      [PlanetName.Rahu]: 5,
      [PlanetName.Saturn]: 8,
      [PlanetName.Venus]: 10,
      [PlanetName.Sun]: 11,
      [PlanetName.Ketu]: 11,
      [PlanetName.Mercury]: 12
    };

    const rows: string[] = ["Planet   | App | Paper | Sign(app)        | inSign°"];
    for (const p of k.planets) {
      const expect = paperHouse[p.name];
      rows.push(
        `${p.name.padEnd(8)} | ${String(p.house).padStart(3)} | ${String(expect ?? "—").padStart(5)} | ${p.rashi.sanskrit.padEnd(16)} | ${(p.degree % 30).toFixed(2)}`
      );
    }
    rows.push(`Lagna in ${k.lagnaRashi.sanskrit} (house 1)`);

    console.log("\n" + rows.join("\n") + "\n");
    expect(k.lagnaRashi.sanskrit).toBe("Karka");

    for (const p of k.planets) {
      const expected = paperHouse[p.name];
      if (expected !== undefined) {
        expect(p.house, `${p.name} should be in house ${expected} (whole-sign from Karka lagna)`).toBe(expected);
      }
    }
  });
});
