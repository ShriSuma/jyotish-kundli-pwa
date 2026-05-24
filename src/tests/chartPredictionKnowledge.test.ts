import { describe, expect, it } from "vitest";
import { calculateKundli } from "../core/KundliEngine";
import {
  houseByNumber,
  HOUSES,
  KENDRA_HOUSES,
  PLANET_HOUSE_RATINGS,
  ratingToScore
} from "../data/vedicChartKnowledge";
import {
  isDusthanaHouse,
  isKendraHouse,
  lifeAreaInsight,
  lordOfHouse,
  natalHousePredictionSignal,
  planetHouseScore
} from "../core/ChartPredictionKnowledge";
import { PlanetName } from "../core/AstroTypes";

const GOKARNA = {
  name: "Pramod",
  birthDate: "1993-05-31",
  birthTime: "09:25",
  latitude: 14.5479,
  longitude: 74.3187,
  pincode: "581326"
};

describe("vedicChartKnowledge", () => {
  it("defines all 12 houses with lords and karakas", () => {
    expect(HOUSES).toHaveLength(12);
    expect(houseByNumber(1)?.naturalLord).toBe(PlanetName.Mars);
    expect(houseByNumber(9)?.naturalLord).toBe(PlanetName.Jupiter);
    expect(houseByNumber(8)?.coLord).toBe(PlanetName.Ketu);
  });

  it("marks kendra and dusthana sets", () => {
    expect(KENDRA_HOUSES).toEqual([1, 4, 7, 10]);
    expect(isKendraHouse(10)).toBe(true);
    expect(isDusthanaHouse(6)).toBe(true);
  });

  it("scores Sun in 10th higher than Sun in 8th", () => {
    expect(planetHouseScore(PlanetName.Sun, 10)).toBeGreaterThan(planetHouseScore(PlanetName.Sun, 8));
    expect(ratingToScore(PLANET_HOUSE_RATINGS.Sun[10])).toBeGreaterThan(0);
  });
});

describe("ChartPredictionKnowledge", () => {
  it("computes life area and natal signals for a sample chart", () => {
    const k = calculateKundli(GOKARNA, { ayanamsaModel: "lahiri" });
    expect(lordOfHouse(k, 7)).toBeDefined();
    const marriage = lifeAreaInsight(k, "marriage");
    const career = lifeAreaInsight(k, "career");
    expect(marriage.houses).toContain(7);
    expect(career.houses).toContain(10);
    expect(typeof natalHousePredictionSignal(k)).toBe("number");
  });
});
