/**
 * Dosha detection (Kālasarpa, Sarpa, Pitṛ, Guru Chaṇḍāla) and life-area report
 * from whole-sign lagna chart. Educational — verify with a qualified jyotiṣī before pooja.
 */
import type { KundliOutput, PlanetName } from "./AstroTypes";
import { PlanetName as PN } from "./AstroTypes";
import { normalizeDegree } from "./AstroMath";
import { ageDecimalYearsAt } from "./birthTime";
import { findBhuktiAtAge } from "./DashaBhuktiEngine";
import {
  computeKundliInsights,
  rashiIndexInHouse,
  signLord,
  type KundliInsights,
  type LifeTone,
  type PitruReasonCode
} from "./KundliInsightsEngine";
import { POOJA_CATALOG, poojasForFlags, type PoojaId, type PoojaRecommendation } from "../data/poojaRecommendations";

export type KalaSarpaTypeId =
  | "anant"
  | "kulik"
  | "vasuki"
  | "shankhpal"
  | "padma"
  | "mahapadma"
  | "takshak"
  | "karkotak"
  | "shankhachud"
  | "ghatak"
  | "vishdhar"
  | "sheshnag";

const KALA_SARPA_BY_RAHU_HOUSE: Record<number, KalaSarpaTypeId> = {
  1: "anant",
  2: "kulik",
  3: "vasuki",
  4: "shankhpal",
  5: "padma",
  6: "mahapadma",
  7: "takshak",
  8: "karkotak",
  9: "shankhachud",
  10: "ghatak",
  11: "vishdhar",
  12: "sheshnag"
};

const TARA_GRAHAS: PlanetName[] = [
  PN.Sun,
  PN.Moon,
  PN.Mars,
  PN.Mercury,
  PN.Jupiter,
  PN.Venus,
  PN.Saturn
];

const planetByName = (k: KundliOutput, name: PlanetName) => k.planets.find((p) => p.name === name);

/** Whole-sign house counted from a reference rāśi (1–12). */
export const houseFromSign = (fromRashiIndex: number, planetRashiIndex: number): number =>
  ((planetRashiIndex - fromRashiIndex + 12) % 12) + 1;

export type SarpaDoshaRef = "lagna" | "sun" | "moon";

export type SarpaDoshaHit = {
  node: "Rahu" | "Ketu";
  ref: SarpaDoshaRef;
  house: number;
};

/** Rahu/Ketu in 6th, 7th, or 8th from Lagna, Sun, or Moon. */
export const detectSarpaDosha = (k: KundliOutput): SarpaDoshaHit[] => {
  const hits: SarpaDoshaHit[] = [];
  const rahu = planetByName(k, PN.Rahu);
  const ketu = planetByName(k, PN.Ketu);
  const sun = planetByName(k, PN.Sun);
  const moon = planetByName(k, PN.Moon);
  if (!rahu || !ketu) return hits;

  const refs: Array<{ ref: SarpaDoshaRef; rashi: number }> = [
    { ref: "lagna", rashi: k.lagnaRashi.index },
    ...(sun ? [{ ref: "sun" as const, rashi: sun.rashi.index }] : []),
    ...(moon ? [{ ref: "moon" as const, rashi: moon.rashi.index }] : [])
  ];

  for (const { ref, rashi } of refs) {
    for (const node of [rahu, ketu] as const) {
      const h = houseFromSign(rashi, node.rashi.index);
      if (h === 6 || h === 7 || h === 8) {
        hits.push({ node: node.name as "Rahu" | "Ketu", ref, house: h });
      }
    }
  }
  return hits;
};

/** Jupiter conjoined Rahu or Ketu (same sign). */
export const detectGuruChandal = (k: KundliOutput): boolean => {
  const jup = planetByName(k, PN.Jupiter);
  const rahu = planetByName(k, PN.Rahu);
  const ketu = planetByName(k, PN.Ketu);
  if (!jup) return false;
  return (
    (rahu !== undefined && jup.rashi.index === rahu.rashi.index) ||
    (ketu !== undefined && jup.rashi.index === ketu.rashi.index)
  );
};

export const kalaSarpaType = (k: KundliOutput, kind: "none" | "partial" | "full"): KalaSarpaTypeId | null => {
  if (kind !== "full") return null;
  const rahu = planetByName(k, PN.Rahu);
  if (!rahu) return null;
  return KALA_SARPA_BY_RAHU_HOUSE[rahu.house] ?? null;
};

export type LifeSpanEstimate = {
  lowYears: number;
  midYears: number;
  highYears: number;
  /** i18n keys for factors that moved the estimate */
  factorKeys: string[];
};

/**
 * Broad indicative life-span band from 8th-house themes — not a medical or death prediction.
 */
export const estimateLifeSpan = (k: KundliOutput): LifeSpanEstimate => {
  const factorKeys: string[] = [];
  let score = 0;
  const lag = k.lagnaRashi.index;
  const eighthSign = rashiIndexInHouse(lag, 8);
  const eighthLord = signLord(eighthSign);
  const lord8 = planetByName(k, eighthLord);
  const moon = planetByName(k, PN.Moon);
  const jup = planetByName(k, PN.Jupiter);
  const sat = planetByName(k, PN.Saturn);
  const mars = planetByName(k, PN.Mars);

  if (lord8 && [1, 4, 5, 9, 10, 11].includes(lord8.house)) {
    score += 2;
    factorKeys.push("eighthLordStrong");
  }
  if (lord8 && [6, 8, 12].includes(lord8.house)) {
    score -= 2;
    factorKeys.push("eighthLordDusthana");
  }
  if (jup && [1, 5, 9, 11].includes(jup.house)) {
    score += 1;
    factorKeys.push("jupiterSupport");
  }
  if (moon && [1, 4, 7, 10].includes(moon.house)) {
    score += 1;
    factorKeys.push("moonKendra");
  }
  if (sat && sat.house === 8) {
    score -= 2;
    factorKeys.push("saturnEighth");
  }
  if (mars && mars.house === 8) {
    score -= 1;
    factorKeys.push("marsEighth");
  }

  const base = 72;
  const mid = Math.min(88, Math.max(58, base + score * 2));
  return {
    lowYears: Math.max(50, mid - 8),
    midYears: mid,
    highYears: Math.min(95, mid + 10),
    factorKeys
  };
};

export type CurrentScenario = {
  ageYears: number | null;
  mahaPlanet: PlanetName | null;
  bhuktiPlanet: PlanetName | null;
  overallTone: LifeTone;
  dashaWeight: "supportive" | "mixed" | "heavy";
};

const dashaWeightFromPlanets = (maha: PlanetName | null, bhukti: PlanetName | null): CurrentScenario["dashaWeight"] => {
  const heavy: PlanetName[] = [PN.Saturn, PN.Rahu, PN.Ketu, PN.Mars];
  const supportive: PlanetName[] = [PN.Jupiter, PN.Venus, PN.Mercury, PN.Moon];
  const planets = [maha, bhukti].filter(Boolean) as PlanetName[];
  if (planets.some((p) => heavy.includes(p))) return "heavy";
  if (planets.some((p) => supportive.includes(p))) return "supportive";
  return "mixed";
};

export const buildCurrentScenario = (
  k: KundliOutput,
  insights: KundliInsights,
  birth?: { birthDate: string; birthTime: string; latitude: number; longitude: number }
): CurrentScenario => {
  let ageYears: number | null = null;
  let mahaPlanet: PlanetName | null = null;
  let bhuktiPlanet: PlanetName | null = null;

  if (birth) {
    ageYears = ageDecimalYearsAt(birth.birthDate, birth.birthTime, birth.latitude, birth.longitude, new Date());
    if (ageYears >= 0) {
      const vb = findBhuktiAtAge(k, ageYears);
      if (vb) {
        mahaPlanet = vb.maha.planet;
        bhuktiPlanet = vb.bhukti;
      }
    }
  }

  const tones = [insights.life.marriage, insights.life.career, insights.life.family, insights.life.health];
  const uplift = tones.filter((t) => t === "uplift").length;
  const care = tones.filter((t) => t === "care").length;
  let overallTone: LifeTone = "mixed";
  if (uplift >= 2 && care === 0) overallTone = "uplift";
  if (care >= 2) overallTone = "care";

  if (insights.kaalsarp === "full" || insights.pitru.level === "moderate") {
    overallTone = care >= 1 ? "care" : "mixed";
  }

  return {
    ageYears,
    mahaPlanet,
    bhuktiPlanet,
    overallTone,
    dashaWeight: dashaWeightFromPlanets(mahaPlanet, bhuktiPlanet)
  };
};

export type DoshaLifeReport = {
  insights: KundliInsights;
  kaalsarp: {
    kind: "none" | "partial" | "full";
    type: KalaSarpaTypeId | null;
    allPlanetsHemmed: boolean;
  };
  sarpaDosha: { active: boolean; hits: SarpaDoshaHit[] };
  guruChandal: boolean;
  pitruReasons: PitruReasonCode[];
  recommendedPoojas: PoojaRecommendation[];
  poojaIds: PoojaId[];
  currentScenario: CurrentScenario;
  longevity: LifeSpanEstimate;
  /** Active dosha summary flags for predictions */
  doshaFlags: {
    hasKaalsarp: boolean;
    hasSarpa: boolean;
    hasPitru: boolean;
    hasGuruChandal: boolean;
  };
};

export const computeDoshaLifeReport = (
  k: KundliOutput,
  birth?: { birthDate: string; birthTime: string; latitude: number; longitude: number }
): DoshaLifeReport => {
  const insights = computeKundliInsights(k);
  const kind = insights.kaalsarp;
  const sarpaHits = detectSarpaDosha(k);
  const guruChandal = detectGuruChandal(k);

  const flagSet = new Set<string>();
  if (kind === "full") flagSet.add("kaalsarp_full");
  if (kind === "partial") flagSet.add("kaalsarp_partial");
  if (sarpaHits.length > 0) flagSet.add("sarpa");
  if (insights.pitru.level === "mild") flagSet.add("pitru_mild");
  if (insights.pitru.level === "moderate") flagSet.add("pitru_moderate");
  if (guruChandal) flagSet.add("guru_chandal");

  const recommendedPoojas =
    flagSet.size > 0 ? poojasForFlags(flagSet) : POOJA_CATALOG.filter((p) => p.id === "rahu_ketu_shanti").slice(0, 0);

  return {
    insights,
    kaalsarp: {
      kind,
      type: kalaSarpaType(k, kind),
      allPlanetsHemmed: kind === "full"
    },
    sarpaDosha: { active: sarpaHits.length > 0, hits: sarpaHits },
    guruChandal,
    pitruReasons: insights.pitru.reasons,
    recommendedPoojas,
    poojaIds: recommendedPoojas.map((p) => p.id),
    currentScenario: buildCurrentScenario(k, insights, birth),
    longevity: estimateLifeSpan(k),
    doshaFlags: {
      hasKaalsarp: kind === "full" || kind === "partial",
      hasSarpa: sarpaHits.length > 0,
      hasPitru: insights.pitru.level !== "none",
      hasGuruChandal: guruChandal
    }
  };
};

/** Re-export for tests. */
export { TARA_GRAHAS };
