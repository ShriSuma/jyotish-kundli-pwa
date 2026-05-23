/**
 * Classical-style *heuristic* chart analysis (whole-sign houses, Lahiri sidereal).
 * Not a substitute for a human astrologer or any single printed tradition.
 */
import type { KundliOutput, PlanetName, PlanetPosition } from "./AstroTypes";
import { PlanetName as PN } from "./AstroTypes";
import { normalizeDegree } from "./AstroMath";
import { generateDashaTimeline } from "./DashaBhuktiEngine";

const TARA_GRAHAS: PlanetName[] = [
  PN.Sun,
  PN.Moon,
  PN.Mars,
  PN.Mercury,
  PN.Jupiter,
  PN.Venus,
  PN.Saturn
];

/** Lord of rāśi index 0–11 (whole-sign). */
export const signLord = (rashiIndex: number): PlanetName => {
  const lords: PlanetName[] = [
    PN.Mars,
    PN.Venus,
    PN.Mercury,
    PN.Moon,
    PN.Sun,
    PN.Mercury,
    PN.Venus,
    PN.Mars,
    PN.Jupiter,
    PN.Saturn,
    PN.Saturn,
    PN.Jupiter
  ];
  return lords[((rashiIndex % 12) + 12) % 12]!;
};

/** Naisargika (natural) friendship — common parāśara-style table. */
export const naturalRelation = (a: PlanetName, b: PlanetName): "mitra" | "shatru" | "sama" => {
  if (a === b) return "sama";
  const row: Record<PlanetName, { mitra: PlanetName[]; shatru: PlanetName[] }> = {
    [PN.Sun]: { mitra: [PN.Moon, PN.Mars, PN.Jupiter], shatru: [PN.Venus, PN.Saturn] },
    [PN.Moon]: { mitra: [PN.Sun, PN.Mercury], shatru: [] },
    [PN.Mars]: { mitra: [PN.Sun, PN.Moon, PN.Jupiter], shatru: [PN.Mercury] },
    [PN.Mercury]: { mitra: [PN.Sun, PN.Venus], shatru: [PN.Moon] },
    [PN.Jupiter]: { mitra: [PN.Sun, PN.Moon, PN.Mars], shatru: [PN.Mercury, PN.Venus] },
    [PN.Venus]: { mitra: [PN.Mercury, PN.Saturn], shatru: [PN.Sun, PN.Moon] },
    [PN.Saturn]: { mitra: [PN.Mercury, PN.Venus], shatru: [PN.Sun, PN.Moon, PN.Mars] },
    [PN.Rahu]: { mitra: [PN.Jupiter, PN.Venus, PN.Saturn], shatru: [PN.Sun, PN.Moon] },
    [PN.Ketu]: { mitra: [PN.Mars, PN.Jupiter], shatru: [PN.Venus, PN.Sun] }
  };
  const r = row[a] ?? { mitra: [], shatru: [] };
  if (r.mitra.includes(b)) return "mitra";
  if (r.shatru.includes(b)) return "shatru";
  return "sama";
};

/** 1-based house → occupied rāśi index 0–11 (whole sign from lagna). */
export const rashiIndexInHouse = (lagnaRashiIdx: number, house: number): number =>
  (((lagnaRashiIdx + (house - 1)) % 12) + 12) % 12;

const planetByName = (k: KundliOutput, name: PlanetName): PlanetPosition | undefined =>
  k.planets.find((p) => p.name === name);

const sameSign = (a: PlanetPosition, b: PlanetPosition): boolean => a.rashi.index === b.rashi.index;

/** N-th whole-sign house clockwise from `fromHouse` (both 1–12 from lagna). */
const nthHouseFrom = (fromHouse: number, n: number): number => ((fromHouse - 1 + (n - 1)) % 12) + 1;

/** Graha vs lord of the sign it occupies — naisargika; internal scoring only (not shown in UI). */
const occupantDispositorScore = (k: KundliOutput, pname: PlanetName): number => {
  const p = planetByName(k, pname);
  if (!p) return 0;
  const L = signLord(p.rashi.index);
  const rel = naturalRelation(p.name, L);
  if (rel === "mitra") return 1;
  if (rel === "shatru") return -1;
  return 0;
};

const inKendraFromMoon = (k: KundliOutput, p: PlanetPosition): boolean => {
  const moon = planetByName(k, PN.Moon);
  if (!moon) return false;
  const d = (p.rashi.index - moon.rashi.index + 12) % 12;
  return d === 0 || d === 3 || d === 6 || d === 9;
};

const inKendraFromLagna = (p: PlanetPosition, lagnaIdx: number): boolean => {
  const d = (p.rashi.index - lagnaIdx + 12) % 12;
  return d === 0 || d === 3 || d === 6 || d === 9;
};

const isOwnOrExalt = (p: PlanetPosition): boolean => {
  const exalt: Partial<Record<PlanetName, number>> = {
    [PN.Sun]: 0,
    [PN.Moon]: 1,
    [PN.Mars]: 9,
    [PN.Mercury]: 5,
    [PN.Jupiter]: 3,
    [PN.Venus]: 11,
    [PN.Saturn]: 6
  };
  const own: Partial<Record<PlanetName, number[]>> = {
    [PN.Sun]: [4],
    [PN.Moon]: [3],
    [PN.Mars]: [0, 7],
    [PN.Mercury]: [2, 5],
    [PN.Jupiter]: [8, 11],
    [PN.Venus]: [1, 6],
    [PN.Saturn]: [9, 10]
  };
  if (exalt[p.name] === p.rashi.index) return true;
  return own[p.name]?.includes(p.rashi.index) ?? false;
};

const kaalsarpKind = (k: KundliOutput): "none" | "partial" | "full" => {
  const rahu = planetByName(k, PN.Rahu);
  if (!rahu) return "none";
  const rahuDeg = rahu.degree;
  const shifted = (deg: number) => normalizeDegree(deg - rahuDeg);
  const longs = TARA_GRAHAS.map((n) => shifted(planetByName(k, n)!.degree));
  const inOpenFirst = longs.filter((g) => g > 0.5 && g < 179.5).length;
  const inOpenSecond = longs.filter((g) => g > 179.5 && g < 359.5).length;
  if (inOpenFirst === 7 || inOpenSecond === 7) return "full";
  if (inOpenFirst >= 5 || inOpenSecond >= 5) return "partial";
  return "none";
};

export type PitruReasonCode = "sun_with_rahu" | "sun_with_saturn" | "ninth_lord_dusthana" | "sun_dusthana";

const pitruAnalysis = (
  k: KundliOutput
): { level: "none" | "mild" | "moderate"; reasons: PitruReasonCode[] } => {
  const reasons: PitruReasonCode[] = [];
  const sun = planetByName(k, PN.Sun);
  const lag = k.lagnaRashi.index;
  if (!sun) return { level: "none", reasons: [] };
  const ninthSign = rashiIndexInHouse(lag, 9);
  const ninthLord = signLord(ninthSign);
  const ninthLordP = k.planets.find((p) => p.name === ninthLord);

  const rahu = planetByName(k, PN.Rahu);
  const sat = planetByName(k, PN.Saturn);
  if (rahu && sameSign(sun, rahu)) reasons.push("sun_with_rahu");
  if (sat && sameSign(sun, sat)) reasons.push("sun_with_saturn");
  if (sun.house === 8 || sun.house === 12 || sun.house === 6) reasons.push("sun_dusthana");
  if (ninthLordP && (ninthLordP.house === 6 || ninthLordP.house === 8 || ninthLordP.house === 12)) {
    reasons.push("ninth_lord_dusthana");
  }
  if (reasons.length >= 2) return { level: "moderate", reasons };
  if (reasons.length === 1) return { level: "mild", reasons };
  return { level: "none", reasons: [] };
};

export type YogaId =
  | "gajakesari"
  | "budhaditya"
  | "ruchaka"
  | "bhadra"
  | "hamsa"
  | "malavya"
  | "sasha"
  | "chandra_mangala"
  | "kemadruma";

export type YogaPolarity = "benefic" | "malefic";

export const YOGA_POLARITY: Record<YogaId, YogaPolarity> = {
  gajakesari: "benefic",
  budhaditya: "benefic",
  ruchaka: "benefic",
  bhadra: "benefic",
  hamsa: "benefic",
  malavya: "benefic",
  sasha: "benefic",
  chandra_mangala: "malefic",
  kemadruma: "malefic"
};

const detectYogas = (k: KundliOutput): YogaId[] => {
  const out: YogaId[] = [];
  const lag = k.lagnaRashi.index;
  const jup = planetByName(k, PN.Jupiter);
  const moon = planetByName(k, PN.Moon);
  const sun = planetByName(k, PN.Sun);
  const mer = planetByName(k, PN.Mercury);
  const mars = planetByName(k, PN.Mars);
  const ven = planetByName(k, PN.Venus);
  const sat = planetByName(k, PN.Saturn);

  if (jup && moon && inKendraFromMoon(k, jup)) out.push("gajakesari");
  if (sun && mer && sameSign(sun, mer)) out.push("budhaditya");
  if (mars && inKendraFromLagna(mars, lag) && isOwnOrExalt(mars)) out.push("ruchaka");
  if (mer && inKendraFromLagna(mer, lag) && isOwnOrExalt(mer)) out.push("bhadra");
  if (jup && inKendraFromLagna(jup, lag) && isOwnOrExalt(jup)) out.push("hamsa");
  if (ven && inKendraFromLagna(ven, lag) && isOwnOrExalt(ven)) out.push("malavya");
  if (sat && inKendraFromLagna(sat, lag) && isOwnOrExalt(sat)) out.push("sasha");
  if (moon && mars && sameSign(moon, mars)) out.push("chandra_mangala");

  if (moon) {
    const prev = (moon.rashi.index + 11) % 12;
    const next = (moon.rashi.index + 1) % 12;
    const inPrev = k.planets.some(
      (p) => p.name !== PN.Moon && p.name !== PN.Rahu && p.name !== PN.Ketu && p.rashi.index === prev
    );
    const inNext = k.planets.some(
      (p) => p.name !== PN.Moon && p.name !== PN.Rahu && p.name !== PN.Ketu && p.rashi.index === next
    );
    if (!inPrev && !inNext) out.push("kemadruma");
  }

  return out;
};

export const detectChartYogas = (k: KundliOutput): YogaId[] => detectYogas(k);

export const chartYogasWithPolarity = (k: KundliOutput): Array<{ id: YogaId; polarity: YogaPolarity }> =>
  detectYogas(k).map((id) => ({ id, polarity: YOGA_POLARITY[id] }));

export type LifeTone = "uplift" | "mixed" | "care";

const lifeMarriage = (k: KundliOutput): LifeTone => {
  const ven = planetByName(k, PN.Venus);
  const jup = planetByName(k, PN.Jupiter);
  const moon = planetByName(k, PN.Moon);
  const seventhSign = rashiIndexInHouse(k.lagnaRashi.index, 7);
  const lord7 = signLord(seventhSign);
  const lord7p = k.planets.find((p) => p.name === lord7);
  let score = 0;
  if (ven && (ven.house === 7 || ven.house === 4 || ven.house === 5)) score += 1;
  if (jup && (jup.house === 7 || jup.house === 5)) score += 1;
  if (lord7p && [1, 4, 5, 7, 9, 10, 11].includes(lord7p.house)) score += 1;
  if (lord7p && [6, 8, 12].includes(lord7p.house)) score -= 2;
  if (ven && [6, 8, 12].includes(ven.house)) score -= 1;

  score += occupantDispositorScore(k, PN.Venus);
  score += occupantDispositorScore(k, PN.Jupiter);
  if (lord7) score += occupantDispositorScore(k, lord7);

  if (ven && moon) {
    const h2 = nthHouseFrom(ven.house, 2);
    const h12 = nthHouseFrom(ven.house, 12);
    if (moon.house === h2 || moon.house === h12) score += 1;
  }

  if (score >= 2) return "uplift";
  if (score <= -1) return "care";
  return "mixed";
};

const lifeCareer = (k: KundliOutput): LifeTone => {
  const sun = planetByName(k, PN.Sun);
  const mer = planetByName(k, PN.Mercury);
  const jup = planetByName(k, PN.Jupiter);
  const sat = planetByName(k, PN.Saturn);
  const tenthSign = rashiIndexInHouse(k.lagnaRashi.index, 10);
  const lord10 = signLord(tenthSign);
  const lord10p = k.planets.find((p) => p.name === lord10);
  let score = 0;
  if (sun && sun.house === 10) score += 2;
  if (mer && mer.house === 10) score += 1;
  if (jup && [1, 5, 9, 10, 11].includes(jup.house)) score += 1;
  if (lord10p && [6, 8, 12].includes(lord10p.house)) score -= 2;

  score += occupantDispositorScore(k, PN.Sun);
  score += occupantDispositorScore(k, PN.Mercury);
  if (lord10) score += occupantDispositorScore(k, lord10);
  if (sat && sat.house === 10) score -= 1;

  if (score >= 2) return "uplift";
  if (score <= -1) return "care";
  return "mixed";
};

const lifeFamily = (k: KundliOutput): LifeTone => {
  const moon = planetByName(k, PN.Moon);
  const jup = planetByName(k, PN.Jupiter);
  let score = 0;
  if (moon && [4, 5, 2, 11].includes(moon.house)) score += 1;
  if (jup && [2, 4, 5, 9].includes(jup.house)) score += 1;
  if (moon && [6, 8, 12].includes(moon.house)) score -= 2;

  score += occupantDispositorScore(k, PN.Moon);
  score += occupantDispositorScore(k, PN.Jupiter);

  if (score >= 1) return "uplift";
  if (score <= -1) return "care";
  return "mixed";
};

const lifeHealth = (k: KundliOutput): LifeTone => {
  const mars = planetByName(k, PN.Mars);
  const sat = planetByName(k, PN.Saturn);
  const moon = planetByName(k, PN.Moon);
  let score = 0;
  if (moon && [1, 4, 5, 9, 10].includes(moon.house)) score += 1;
  if (mars && [3, 6, 8, 12].includes(mars.house)) score -= 1;
  if (sat && [6, 8, 12].includes(sat.house)) score -= 1;

  score += occupantDispositorScore(k, PN.Moon);
  score += occupantDispositorScore(k, PN.Mars);
  score += occupantDispositorScore(k, PN.Saturn);

  if (score >= 1) return "uplift";
  if (score <= -1) return "care";
  return "mixed";
};

/** Broader “path” tone from lagna/Moon dispositors and houses — internal, surfaced as one gentle paragraph. */
const lifePathStory = (k: KundliOutput): "open" | "woven" | "deep" => {
  let score = 0;
  const moon = planetByName(k, PN.Moon);
  if (moon) {
    score += occupantDispositorScore(k, PN.Moon);
    if ([5, 9, 11].includes(moon.house)) score += 1;
    if ([6, 8, 12].includes(moon.house)) score -= 1;
  }
  score += occupantDispositorScore(k, PN.Jupiter);
  score += occupantDispositorScore(k, PN.Sun);
  const rahu = planetByName(k, PN.Rahu);
  if (rahu && [9, 10, 11].includes(rahu.house)) score += 1;
  if (score >= 2) return "open";
  if (score <= -1) return "deep";
  return "woven";
};

/** First mahādasha at/after `minAge` led by Venus, Jupiter, or 7th lord — rough marriage-timing hint. */
export const marriageDashaWindow = (
  k: KundliOutput,
  minAge = 18
): { startAge: number; endAge: number; planet: PlanetName } | null => {
  const seventhSign = rashiIndexInHouse(k.lagnaRashi.index, 7);
  const lord7 = signLord(seventhSign);
  const targets = new Set<PlanetName>([PN.Venus, PN.Jupiter, lord7]);
  const timeline = generateDashaTimeline(k, 100);
  const hit = timeline.find((e) => e.startAge >= minAge - 1e-6 && targets.has(e.planet));
  return hit ? { startAge: hit.startAge, endAge: hit.endAge, planet: hit.planet } : null;
};

export type HousemateRelation = {
  a: PlanetName;
  b: PlanetName;
  relation: "mitra" | "shatru" | "sama";
};

/** Co-occupants of same sign (excluding Rāhu/Ketu pairs noise). */
export const sameSignFriendshipSamples = (k: KundliOutput, max = 12): HousemateRelation[] => {
  const rows: HousemateRelation[] = [];
  const ps = k.planets.filter((p) => p.name !== PN.Rahu && p.name !== PN.Ketu);
  for (let i = 0; i < ps.length; i += 1) {
    for (let j = i + 1; j < ps.length; j += 1) {
      if (rows.length >= max) return rows;
      if (ps[i]!.rashi.index === ps[j]!.rashi.index) {
        rows.push({ a: ps[i]!.name, b: ps[j]!.name, relation: naturalRelation(ps[i]!.name, ps[j]!.name) });
      }
    }
  }
  return rows;
};

export type KundliInsights = {
  kaalsarp: "none" | "partial" | "full";
  pitru: { level: "none" | "mild" | "moderate"; reasons: PitruReasonCode[] };
  yogas: YogaId[];
  life: {
    marriage: LifeTone;
    career: LifeTone;
    family: LifeTone;
    health: LifeTone;
  };
  /** One umbrella “walk of life” tone for a single gentle paragraph. */
  lifePath: "open" | "woven" | "deep";
  marriageWindow: { startAge: number; endAge: number; planet: PlanetName } | null;
  seventhLord: PlanetName;
  housemates: HousemateRelation[];
};

export const computeKundliInsights = (k: KundliOutput): KundliInsights => {
  const seventhSign = rashiIndexInHouse(k.lagnaRashi.index, 7);
  const seventhLord = signLord(seventhSign);
  return {
    kaalsarp: kaalsarpKind(k),
    pitru: pitruAnalysis(k),
    yogas: detectYogas(k),
    life: {
      marriage: lifeMarriage(k),
      career: lifeCareer(k),
      family: lifeFamily(k),
      health: lifeHealth(k)
    },
    lifePath: lifePathStory(k),
    marriageWindow: marriageDashaWindow(k, 18),
    seventhLord,
    housemates: sameSignFriendshipSamples(k, 14)
  };
};

/** House numbers for `insights.yogaDialog.*.whyThis` (whole-sign from lagna). */
export const yogaDialogVars = (k: KundliOutput): Record<string, number> => {
  const moon = planetByName(k, PN.Moon);
  const jup = planetByName(k, PN.Jupiter);
  const sun = planetByName(k, PN.Sun);
  const mer = planetByName(k, PN.Mercury);
  const mars = planetByName(k, PN.Mars);
  const ven = planetByName(k, PN.Venus);
  const sat = planetByName(k, PN.Saturn);
  return {
    moonHouse: moon?.house ?? 0,
    jupHouse: jup?.house ?? 0,
    sunHouse: sun?.house ?? 0,
    merHouse: mer?.house ?? 0,
    marsHouse: mars?.house ?? 0,
    venHouse: ven?.house ?? 0,
    satHouse: sat?.house ?? 0,
    lagnaRashi: k.lagnaRashi.index
  };
};
