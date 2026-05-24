/**
 * Helpers that turn vedicChartKnowledge into prediction signals from a natal chart.
 */
import type { KundliOutput, PlanetName } from "./AstroTypes";
import { PlanetName as PN } from "./AstroTypes";
import { naturalRelation, rashiIndexInHouse, signLord } from "./KundliInsightsEngine";
import {
  DUSTHANA_HOUSES,
  KENDRA_HOUSES,
  LIFE_AREA_HOUSES,
  PLANET_HOUSE_RATINGS,
  TRIKONA_HOUSES,
  houseByNumber,
  ratingToScore,
  type HouseKnowledge
} from "../data/vedicChartKnowledge";

export type PlanetHouseInsight = {
  planet: PlanetName;
  house: number;
  score: number;
  rating: string;
  houseThemes: string[];
};

export type LifeAreaInsight = {
  area: keyof typeof LIFE_AREA_HOUSES;
  score: number;
  houses: number[];
  note: string;
};

export const isKendraHouse = (h: number): boolean => (KENDRA_HOUSES as readonly number[]).includes(h);
export const isTrikonaHouse = (h: number): boolean => (TRIKONA_HOUSES as readonly number[]).includes(h);
export const isDusthanaHouse = (h: number): boolean => (DUSTHANA_HOUSES as readonly number[]).includes(h);

/** Score −2…+2 for a graha in a bhāva from lagna (whole-sign). */
export const planetHouseScore = (planet: PlanetName, house: number): number => {
  const rated = PLANET_HOUSE_RATINGS[planet]?.[house];
  let score = ratingToScore(rated);
  if (isKendraHouse(house) && score >= 0) score += 1;
  if (isTrikonaHouse(house) && score >= 0) score += 1;
  if (isDusthanaHouse(house) && score <= 0) score -= 1;
  return Math.max(-2, Math.min(2, score));
};

export const planetHouseInsight = (k: KundliOutput, planet: PlanetName): PlanetHouseInsight | null => {
  const p = k.planets.find((x) => x.name === planet);
  if (!p) return null;
  const hk = houseByNumber(p.house);
  const rating = PLANET_HOUSE_RATINGS[planet]?.[p.house] ?? "neutral";
  return {
    planet,
    house: p.house,
    score: planetHouseScore(planet, p.house),
    rating,
    houseThemes: hk?.themes ?? []
  };
};

/** Lord of bhāva N from lagna (whole-sign). */
export const lordOfHouse = (k: KundliOutput, house: number): PlanetName => {
  const signIdx = rashiIndexInHouse(k.lagnaRashi.index, house);
  return signLord(signIdx);
};

/** How well the lord of a house is placed (its own house score). */
export const houseLordPlacementScore = (k: KundliOutput, house: number): number => {
  const lord = lordOfHouse(k, house);
  const lp = k.planets.find((p) => p.name === lord);
  if (!lp) return 0;
  return planetHouseScore(lord, lp.house);
};

const areaNote = (area: keyof typeof LIFE_AREA_HOUSES, score: number): string => {
  if (score >= 2) return `${area}: strong house support`;
  if (score >= 0) return `${area}: mixed but workable`;
  return `${area}: needs patience and remedies`;
};

/** Aggregate score for marriage, career, wealth, etc. from relevant bhāvas + karakas. */
export const lifeAreaInsight = (
  k: KundliOutput,
  area: keyof typeof LIFE_AREA_HOUSES
): LifeAreaInsight => {
  const houses = LIFE_AREA_HOUSES[area];
  let score = 0;
  for (const h of houses) {
    score += houseLordPlacementScore(k, h);
  }
  const karakaBoost: Partial<Record<keyof typeof LIFE_AREA_HOUSES, PlanetName[]>> = {
    marriage: [PN.Venus, PN.Jupiter],
    career: [PN.Sun, PN.Mercury, PN.Saturn],
    wealth: [PN.Jupiter, PN.Venus],
    health: [PN.Moon, PN.Sun],
    spirituality: [PN.Jupiter, PN.Ketu],
    gains: [PN.Jupiter],
    self: [PN.Sun, PN.Moon]
  };
  for (const g of karakaBoost[area] ?? []) {
    const ins = planetHouseInsight(k, g);
    if (ins) score += ins.score;
  }
  return { area, score, houses, note: areaNote(area, score) };
};

/** Combined natal signal for daily/weekly tone (−4…+4 typical). */
export const natalHousePredictionSignal = (k: KundliOutput, focusPlanet?: PlanetName): number => {
  let s = 0;
  const focus = focusPlanet ?? PN.Moon;
  const fi = planetHouseInsight(k, focus);
  if (fi) s += fi.score;

  const moon = planetHouseInsight(k, PN.Moon);
  if (moon) s += Math.round(moon.score / 2);

  const lagnaLord = signLord(k.lagnaRashi.index);
  const ll = planetHouseInsight(k, lagnaLord);
  if (ll) s += Math.round(ll.score / 2);

  if (isDusthanaHouse(fi?.house ?? 0)) s -= 1;
  if (isKendraHouse(fi?.house ?? 0) && (fi?.score ?? 0) > 0) s += 1;

  return Math.max(-4, Math.min(4, s));
};

export const allPlanetHouseInsights = (k: KundliOutput): PlanetHouseInsight[] =>
  k.planets
    .filter((p) => p.name !== PN.Rahu && p.name !== PN.Ketu)
    .map((p) => planetHouseInsight(k, p.name)!)
    .filter(Boolean);

/** Dispositor relation: graha vs lord of sign it occupies. */
export const dispositorRelation = (
  k: KundliOutput,
  planet: PlanetName
): "mitra" | "shatru" | "sama" | null => {
  const p = k.planets.find((x) => x.name === planet);
  if (!p) return null;
  const lord = signLord(p.rashi.index);
  return naturalRelation(planet, lord);
};

export const summarizeHouse = (h: number): HouseKnowledge | undefined => houseByNumber(h);
