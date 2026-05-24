/**
 * Per-bhāva scored predictions and Vimśottari dasha/bhukti caution windows.
 * Built from whole-sign Lagna chart analysis — human-readable astrologer-style copy.
 */
import type { TFunction } from "i18next";
import type { KundliOutput, PlanetName } from "./AstroTypes";
import { PlanetName as PN } from "./AstroTypes";
import { generateBhuktiTimeline } from "./DashaBhuktiEngine";
import type { BhavaReading } from "./KundliReadingEngine";
import { rashiIndexInHouse, signLord } from "./KundliInsightsEngine";
import { houseMeta, SIGN_ELEMENTS } from "../data/southIndianHouseGuide";

export type ScoreTier = "excellent" | "good" | "average" | "weak" | "challenging";

export type HousePrediction = {
  house: number;
  nameKey: string;
  score: number;
  stars: number;
  tier: ScoreTier;
  prediction: string;
  themes: string;
  bodyParts: string;
};

export type DashaCautionPeriod = {
  fromAge: number;
  toAge: number;
  maha: PlanetName;
  bhukti: PlanetName;
  reason: string;
  dangerHints: string[];
  isCurrent: boolean;
};

const HEAVY_GRAHAS: PlanetName[] = [PN.Saturn, PN.Rahu, PN.Ketu, PN.Mars];

const planetT = (t: TFunction, p: PlanetName): string =>
  t(`planets.${p}` as "planets.Sun") || String(p);

const rashiT = (t: TFunction, r: BhavaReading["rashi"]): string =>
  t(`rashis.${r.sanskrit.replace(/\s+/g, "")}` as "rashis.Mesha") || r.english;

const relationPhrase = (t: TFunction, rel: BhavaReading["lordRelation"]): string =>
  t(`reading.relation.${rel}` as "reading.relation.mitra");

export const netScoreToPercent = (netScore: number): number =>
  Math.round(Math.min(95, Math.max(15, 50 + netScore * 8)));

export const percentToStars = (score: number): number => Math.max(1, Math.min(5, Math.round(score / 20)));

export const scoreTier = (score: number): ScoreTier => {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "average";
  if (score >= 30) return "weak";
  return "challenging";
};

const lordContextKey = (lordHouse: number, lordRelation: BhavaReading["lordRelation"]): string => {
  if (lordRelation === "own") return "ownSign";
  if (lordHouse === 6 || lordHouse === 8 || lordHouse === 12) return "dusthana";
  if (lordHouse === 1 || lordHouse === 4 || lordHouse === 7 || lordHouse === 10) return "kendra";
  if (lordHouse === 5 || lordHouse === 9) return "trikona";
  if (lordHouse === 3 || lordHouse === 11) return "upachaya";
  return "general";
};

const occupantLine = (bhava: BhavaReading, t: TFunction): string => {
  if (bhava.occupants.length === 0) return t("reading.housePrediction.noGraha");
  return bhava.occupants
    .map((o) =>
      t("reading.housePrediction.grahaInHouse", {
        planet: planetT(t, o.planet),
        relation: relationPhrase(t, o.relationToSignLord)
      })
    )
    .join(" ");
};

const dusthanaLords = (k: KundliOutput): PlanetName[] =>
  [6, 8, 12].map((h) => signLord(rashiIndexInHouse(k.lagnaRashi.index, h)));

const dangerKeysForGraha = (p: PlanetName): string[] => {
  switch (p) {
    case PN.Mars:
      return ["fire", "accidents", "surgery", "heat"];
    case PN.Saturn:
      return ["falls", "bones", "chronic", "delays"];
    case PN.Rahu:
      return ["poison", "deception", "sudden", "snake"];
    case PN.Ketu:
      return ["cuts", "isolation", "sudden"];
    case PN.Moon:
      return ["water", "travel", "chest"];
    case PN.Sun:
      return ["heat", "heart", "authority"];
    default:
      return [];
  }
};

const dangerKeysForChart = (k: KundliOutput, maha: PlanetName, bhukti: PlanetName): string[] => {
  const keys = new Set<string>();
  for (const p of [maha, bhukti]) {
    for (const d of dangerKeysForGraha(p)) keys.add(d);
  }
  const mars = k.planets.find((x) => x.name === PN.Mars);
  const moon = k.planets.find((x) => x.name === PN.Moon);
  if (mars && (mars.house === 8 || mars.house === 12) && (maha === PN.Mars || bhukti === PN.Mars)) {
    keys.add("fire");
    keys.add("accidents");
  }
  if (moon && (moon.house === 4 || moon.house === 8) && (maha === PN.Moon || bhukti === PN.Moon)) {
    keys.add("water");
  }
  if ((maha === PN.Rahu || bhukti === PN.Rahu || maha === PN.Ketu || bhukti === PN.Ketu) && keys.size === 0) {
    keys.add("sudden");
  }
  return [...keys].slice(0, 4);
};

const periodReason = (
  t: TFunction,
  maha: PlanetName,
  bhukti: PlanetName,
  dustLords: PlanetName[],
  isMahaHeavy: boolean
): string => {
  if (dustLords.includes(maha) && dustLords.includes(bhukti)) {
    return t("reading.dashaCaution.reason.dusthanaBoth", {
      maha: planetT(t, maha),
      bhukti: planetT(t, bhukti)
    });
  }
  if (dustLords.includes(maha)) {
    return t("reading.dashaCaution.reason.dusthanaMaha", { maha: planetT(t, maha) });
  }
  if (isMahaHeavy && HEAVY_GRAHAS.includes(bhukti)) {
    return t("reading.dashaCaution.reason.heavyStack", {
      maha: planetT(t, maha),
      bhukti: planetT(t, bhukti)
    });
  }
  if (HEAVY_GRAHAS.includes(maha)) {
    return t("reading.dashaCaution.reason.heavyMaha", { maha: planetT(t, maha) });
  }
  return t("reading.dashaCaution.reason.heavyBhukti", {
    maha: planetT(t, maha),
    bhukti: planetT(t, bhukti)
  });
};

export const buildHousePredictions = (bhavas: BhavaReading[], t: TFunction): HousePrediction[] =>
  bhavas.map((bhava) => {
    const meta = houseMeta(bhava.house);
    const score = netScoreToPercent(bhava.netScore);
    const tier = scoreTier(score);
    const stars = percentToStars(score);
    const element = t(`reading.elements.${SIGN_ELEMENTS[bhava.rashi.index]}` as "reading.elements.fire");
    const lordCtx = t(
      `reading.lordContext.${lordContextKey(bhava.lordHouse, bhava.lordRelation)}` as "reading.lordContext.kendra"
    );

    const lordHouseLabel = t("reading.houseN", { n: bhava.lordHouse });

    const prediction = t(`reading.housePrediction.${tier}` as "reading.housePrediction.good", {
      house: bhava.house,
      houseName: t(meta.nameKey as "reading.houseNames.h1"),
      rashi: rashiT(t, bhava.rashi),
      element,
      score,
      stars,
      lord: planetT(t, bhava.lord),
      lordHouse: bhava.lordHouse,
      lordHouseLabel,
      lordRelation: relationPhrase(t, bhava.lordRelation),
      lordContext: lordCtx,
      occupants: occupantLine(bhava, t),
      themes: t(meta.themeKey as "reading.houseThemes.h1")
    });

    return {
      house: bhava.house,
      nameKey: meta.nameKey,
      score,
      stars,
      tier,
      prediction,
      themes: t(meta.themeKey as "reading.houseThemes.h1"),
      bodyParts: t(meta.bodyPartsKey as "reading.houseBody.h1")
    };
  });

export const generateDashaCautions = (
  k: KundliOutput,
  currentAge: number | null,
  t: TFunction,
  maxYears = 100
): DashaCautionPeriod[] => {
  const dustLords = dusthanaLords(k);
  const timeline = generateBhuktiTimeline(k, maxYears);
  const ageNow = currentAge ?? 0;
  const seen = new Set<string>();
  const out: DashaCautionPeriod[] = [];

  for (const span of timeline) {
    if (span.endAge <= ageNow - 0.5 && span.endAge < ageNow) continue;
    if (span.startAge > ageNow + 35) break;

    const mahaHeavy = HEAVY_GRAHAS.includes(span.maha) || dustLords.includes(span.maha);
    const bhuktiHeavy = HEAVY_GRAHAS.includes(span.bhukti) || dustLords.includes(span.bhukti);
    if (!mahaHeavy && !bhuktiHeavy) continue;

    const key = `${span.maha}-${span.bhukti}-${Math.floor(span.startAge)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dangerKeys = dangerKeysForChart(k, span.maha, span.bhukti);
    out.push({
      fromAge: Math.max(0, Math.round(span.startAge * 10) / 10),
      toAge: Math.round(span.endAge * 10) / 10,
      maha: span.maha,
      bhukti: span.bhukti,
      reason: periodReason(t, span.maha, span.bhukti, dustLords, mahaHeavy),
      dangerHints: dangerKeys.map((d) => t(`reading.danger.${d}` as "reading.danger.fire")),
      isCurrent: ageNow >= span.startAge && ageNow < span.endAge
    });
    if (out.length >= 8) break;
  }

  return out;
};

export const formatDashaCautionLine = (period: DashaCautionPeriod, t: TFunction): string => {
  const danger =
    period.dangerHints.length > 0
      ? t("reading.dashaCaution.dangerSuffix", { dangers: period.dangerHints.join(", ") })
      : "";
  const current = period.isCurrent ? t("reading.dashaCaution.currentNow") : "";
  return t("reading.dashaCaution.line", {
    from: period.fromAge.toFixed(1),
    to: period.toAge.toFixed(1),
    reason: period.reason,
    danger,
    current
  });
};
