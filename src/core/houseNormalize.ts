/**
 * Defensive recomputation of `planet.house` and `maandi.house` using current whole-sign rule.
 * Kundli records persisted in IndexedDB before the whole-sign fix can carry stale house numbers;
 * apply this before any narrative/insights so the displayed house always matches the South chart.
 */
import type { KundliOutput } from "./AstroTypes";
import { bhavaFromAscendant } from "./KundliEngine";

export const normalizeKundliHouses = (k: KundliOutput): KundliOutput => {
  const planets = k.planets.map((p) => ({
    ...p,
    house: bhavaFromAscendant(k.ascendant, p.degree)
  }));
  return { ...k, planets };
};
