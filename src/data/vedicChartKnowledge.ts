/**
 * Vedic chart knowledge for house-based predictions.
 * Synthesized from classical Parāśara / BPHS conventions and common teaching sources:
 * - 12 bhāvas: themes, natural lords (rāśi owners), karakas
 * - Kendra (1,4,7,10), trikona (1,5,9), dusthāna (6,8,12), upachaya (3,6,10,11), maraka (2,7)
 * - Natural mitra/śatru (see KundliInsightsEngine.naturalRelation)
 * - Planet strength by house placement (applied vedic / traditional lists)
 *
 * Used by ChartPredictionKnowledge.ts — not a substitute for full human judgement.
 */
import type { PlanetName } from "../core/AstroTypes";
import { PlanetName as PN } from "../core/AstroTypes";

export type HouseCategory = "kendra" | "trikona" | "dusthana" | "upachaya" | "maraka" | "mixed";

export type HouseStrength = "auspicious" | "mixed" | "challenging";

export type HouseKnowledge = {
  house: number;
  /** Sanskrit-style name key for i18n */
  nameKey: string;
  englishName: string;
  naturalSign: string;
  naturalLord: PlanetName;
  /** Co-lord for Scorpio (Mars primary, Ketu in some traditions) */
  coLord?: PlanetName;
  karakas: PlanetName[];
  categories: HouseCategory[];
  strength: HouseStrength;
  themes: string[];
};

/** Classical natural friendship — mirrors KundliInsightsEngine (Grah Mitra / Śatru tables). */
export const NAISARGIKA_FRIENDSHIP: Record<
  PlanetName,
  { friends: PlanetName[]; enemies: PlanetName[]; neutral?: PlanetName[] }
> = {
  [PN.Sun]: { friends: [PN.Moon, PN.Mars, PN.Jupiter], enemies: [PN.Venus, PN.Saturn] },
  [PN.Moon]: { friends: [PN.Sun, PN.Mercury], enemies: [] },
  [PN.Mars]: { friends: [PN.Sun, PN.Moon, PN.Jupiter], enemies: [PN.Mercury] },
  [PN.Mercury]: { friends: [PN.Sun, PN.Venus], enemies: [PN.Moon] },
  [PN.Jupiter]: { friends: [PN.Sun, PN.Moon, PN.Mars], enemies: [PN.Mercury, PN.Venus] },
  [PN.Venus]: { friends: [PN.Mercury, PN.Saturn], enemies: [PN.Sun, PN.Moon] },
  [PN.Saturn]: { friends: [PN.Mercury, PN.Venus], enemies: [PN.Sun, PN.Moon, PN.Mars] },
  [PN.Rahu]: { friends: [PN.Jupiter, PN.Venus, PN.Saturn], enemies: [PN.Sun, PN.Moon] },
  [PN.Ketu]: { friends: [PN.Mars, PN.Jupiter], enemies: [PN.Venus, PN.Sun] }
};

export const HOUSES: HouseKnowledge[] = [
  {
    house: 1,
    nameKey: "predictions.knowledge.house1.name",
    englishName: "House of Self (Lagna)",
    naturalSign: "Mesha",
    naturalLord: PN.Mars,
    karakas: [PN.Sun],
    categories: ["kendra", "trikona"],
    strength: "auspicious",
    themes: ["personality", "body", "appearance", "vitality", "overall life direction"]
  },
  {
    house: 2,
    nameKey: "predictions.knowledge.house2.name",
    englishName: "House of Wealth",
    naturalSign: "Vrishabha",
    naturalLord: PN.Venus,
    karakas: [PN.Jupiter],
    categories: ["maraka", "mixed"],
    strength: "mixed",
    themes: ["finances", "savings", "family", "speech", "food", "right eye"]
  },
  {
    house: 3,
    nameKey: "predictions.knowledge.house3.name",
    englishName: "House of Effort",
    naturalSign: "Mithuna",
    naturalLord: PN.Mercury,
    karakas: [PN.Mars],
    categories: ["upachaya", "mixed"],
    strength: "mixed",
    themes: ["siblings", "courage", "hobbies", "short travel", "communication", "skills"]
  },
  {
    house: 4,
    nameKey: "predictions.knowledge.house4.name",
    englishName: "House of Home & Comfort",
    naturalSign: "Karka",
    naturalLord: PN.Moon,
    karakas: [PN.Moon, PN.Mars, PN.Venus],
    categories: ["kendra"],
    strength: "auspicious",
    themes: ["home", "mother", "property", "vehicles", "inner happiness", "education roots"]
  },
  {
    house: 5,
    nameKey: "predictions.knowledge.house5.name",
    englishName: "House of Creativity",
    naturalSign: "Simha",
    naturalLord: PN.Sun,
    karakas: [PN.Jupiter],
    categories: ["trikona", "mixed"],
    strength: "mixed",
    themes: ["children", "intelligence", "romance", "speculation", "past merit", "mantras"]
  },
  {
    house: 6,
    nameKey: "predictions.knowledge.house6.name",
    englishName: "House of Challenges",
    naturalSign: "Kanya",
    naturalLord: PN.Mercury,
    karakas: [PN.Mars, PN.Saturn],
    categories: ["dusthana", "upachaya"],
    strength: "challenging",
    themes: ["enemies", "debts", "disease", "litigation", "daily service", "obstacles"]
  },
  {
    house: 7,
    nameKey: "predictions.knowledge.house7.name",
    englishName: "House of Partnership",
    naturalSign: "Tula",
    naturalLord: PN.Venus,
    karakas: [PN.Venus],
    categories: ["kendra", "maraka"],
    strength: "auspicious",
    themes: ["marriage", "spouse", "business partners", "contracts", "public dealings"]
  },
  {
    house: 8,
    nameKey: "predictions.knowledge.house8.name",
    englishName: "House of Transformation",
    naturalSign: "Vrischika",
    naturalLord: PN.Mars,
    coLord: PN.Ketu,
    karakas: [PN.Saturn],
    categories: ["dusthana"],
    strength: "challenging",
    themes: ["longevity", "inheritance", "sudden events", "occult", "joint finances", "secrets"]
  },
  {
    house: 9,
    nameKey: "predictions.knowledge.house9.name",
    englishName: "House of Fortune",
    naturalSign: "Dhanu",
    naturalLord: PN.Jupiter,
    karakas: [PN.Sun, PN.Jupiter],
    categories: ["trikona"],
    strength: "auspicious",
    themes: ["luck", "dharma", "guru", "higher learning", "long journeys", "father", "faith"]
  },
  {
    house: 10,
    nameKey: "predictions.knowledge.house10.name",
    englishName: "House of Career",
    naturalSign: "Makara",
    naturalLord: PN.Saturn,
    karakas: [PN.Sun, PN.Mercury, PN.Jupiter, PN.Saturn],
    categories: ["kendra", "upachaya"],
    strength: "auspicious",
    themes: ["career", "reputation", "authority", "public status", "karma in the world"]
  },
  {
    house: 11,
    nameKey: "predictions.knowledge.house11.name",
    englishName: "House of Gains",
    naturalSign: "Kumbha",
    naturalLord: PN.Saturn,
    karakas: [PN.Jupiter],
    categories: ["upachaya"],
    strength: "auspicious",
    themes: ["income", "profits", "friends", "networks", "fulfillment of desires", "elder siblings"]
  },
  {
    house: 12,
    nameKey: "predictions.knowledge.house12.name",
    englishName: "House of Liberation",
    naturalSign: "Meena",
    naturalLord: PN.Jupiter,
    karakas: [PN.Saturn],
    categories: ["dusthana"],
    strength: "challenging",
    themes: ["expenses", "foreign lands", "sleep", "isolation", "moksha", "losses", "subconscious"]
  }
];

/** Kendra, trikona, dusthāna sets for quick lookup */
export const KENDRA_HOUSES = [1, 4, 7, 10] as const;
export const TRIKONA_HOUSES = [1, 5, 9] as const;
export const DUSTHANA_HOUSES = [6, 8, 12] as const;
export const UPACHAYA_HOUSES = [3, 6, 10, 11] as const;
export const MARAKA_HOUSES = [2, 7] as const;

/**
 * Planet × house placement strength for prediction scoring.
 * good = +1, excellent = +2, weak = -1, veryWeak = -2
 * Based on common Parāśara / applied-vedic house lists (Sun strong in 10, Saturn OK in 6, etc.)
 */
export type PlanetHouseRating = "excellent" | "good" | "neutral" | "weak" | "veryWeak";

export const PLANET_HOUSE_RATINGS: Record<
  PlanetName,
  Partial<Record<number, PlanetHouseRating>>
> = {
  [PN.Sun]: {
    1: "excellent",
    10: "excellent",
    11: "good",
    5: "good",
    9: "good",
    6: "weak",
    8: "veryWeak",
    12: "veryWeak"
  },
  [PN.Moon]: {
    1: "excellent",
    4: "excellent",
    7: "good",
    10: "good",
    5: "good",
    8: "veryWeak",
    12: "weak"
  },
  [PN.Mars]: {
    1: "excellent",
    3: "excellent",
    6: "good",
    10: "excellent",
    11: "good",
    4: "weak",
    7: "weak",
    8: "veryWeak",
    12: "weak"
  },
  [PN.Mercury]: {
    1: "good",
    4: "good",
    5: "excellent",
    6: "good",
    10: "excellent",
    8: "weak",
    12: "weak"
  },
  [PN.Jupiter]: {
    1: "excellent",
    2: "good",
    5: "excellent",
    9: "excellent",
    10: "good",
    11: "good",
    6: "weak",
    8: "weak",
    12: "weak"
  },
  [PN.Venus]: {
    1: "good",
    4: "excellent",
    5: "good",
    7: "excellent",
    9: "good",
    10: "good",
    11: "good",
    6: "weak",
    8: "veryWeak",
    12: "weak"
  },
  [PN.Saturn]: {
    3: "good",
    6: "good",
    10: "excellent",
    11: "good",
    1: "weak",
    4: "weak",
    5: "weak",
    7: "weak",
    8: "weak",
    12: "weak"
  },
  [PN.Rahu]: {
    3: "good",
    6: "good",
    10: "good",
    11: "good",
    1: "weak",
    7: "weak",
    8: "weak"
  },
  [PN.Ketu]: {
    6: "good",
    12: "good",
    8: "neutral",
    1: "weak",
    7: "weak"
  }
};

/** Life area → primary houses for themed predictions */
export const LIFE_AREA_HOUSES: Record<
  "self" | "wealth" | "career" | "marriage" | "health" | "spirituality" | "gains",
  number[]
> = {
  self: [1, 3],
  wealth: [2, 11],
  career: [10, 6],
  marriage: [7, 2],
  health: [1, 6, 8],
  spirituality: [9, 12],
  gains: [11, 2]
};

export const houseByNumber = (n: number): HouseKnowledge | undefined =>
  HOUSES.find((h) => h.house === n);

export const ratingToScore = (r: PlanetHouseRating | undefined): number => {
  if (r === "excellent") return 2;
  if (r === "good") return 1;
  if (r === "weak") return -1;
  if (r === "veryWeak") return -2;
  return 0;
};
