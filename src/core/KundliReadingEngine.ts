/**
 * Whole-sign lagna chart reading: 12 bhāvas, lords, graha placement, mitra/śatru, dasha.
 * All narratives are built from the generated Kundli — not generic copy.
 */
import type { TFunction } from "i18next";
import type { KundliOutput, PlanetName, Rashi } from "./AstroTypes";
import { PlanetName as PN, RASHIS } from "./AstroTypes";
import {
  houseLordPlacementScore,
  lifeAreaInsight,
  planetHouseInsight,
  planetHouseScore
} from "./ChartPredictionKnowledge";
import { ageDecimalYearsAt } from "./birthTime";
import { findBhuktiAtAge } from "./DashaBhuktiEngine";
import type { DoshaLifeReport } from "./DoshaLifeEngine";
import { naturalRelation, rashiIndexInHouse, signLord } from "./KundliInsightsEngine";
import { PLANET_HOUSE_RATINGS } from "../data/vedicChartKnowledge";
import {
  buildHousePredictions,
  formatDashaCautionLine,
  generateDashaCautions,
  type DashaCautionPeriod,
  type HousePrediction
} from "./HousePredictionEngine";

export type GrahaPlacement = {
  planet: PlanetName;
  house: number;
  rashi: Rashi;
  relationToSignLord: "mitra" | "shatru" | "sama" | "own";
  score: number;
  rating: string;
};

export type BhavaReading = {
  house: number;
  rashi: Rashi;
  lord: PlanetName;
  lordHouse: number;
  lordRelation: "mitra" | "shatru" | "sama" | "own";
  lordScore: number;
  occupants: GrahaPlacement[];
  netScore: number;
};

export type KundliReading = {
  intro: string;
  lagnaLine: string;
  ageLine: string;
            /** empty if unknown */
  dashaLine: string;
  currentPhase: string;
  marriage: string;
  family: string;
  career: string;
  careerJobs: string;
  health: string;
  cautions: string[];
  strengths: string[];
  houseNotes: string[];
  housePredictions: HousePrediction[];
  dashaCautions: DashaCautionPeriod[];
  dashaCautionLines: string[];
  doshaLine: string;
  longevityLine: string;
  houses: BhavaReading[];
};

const TARA: PlanetName[] = [PN.Sun, PN.Moon, PN.Mars, PN.Mercury, PN.Jupiter, PN.Venus, PN.Saturn];

const planetT = (t: TFunction, p: PlanetName): string =>
  t(`planets.${p}` as "planets.Sun") || String(p);

const rashiT = (t: TFunction, r: Rashi): string =>
  t(`rashis.${r.sanskrit.replace(/\s+/g, "")}` as "rashis.Mesha") || r.english;

const rashiAt = (idx: number): Rashi => RASHIS[((idx % 12) + 12) % 12]!;

const relationToSignLord = (planet: PlanetName, signIdx: number): GrahaPlacement["relationToSignLord"] => {
  const lord = signLord(signIdx);
  if (planet === lord) return "own";
  const rel = naturalRelation(planet, lord);
  return rel;
};

const grahaPlacement = (k: KundliOutput, planet: PlanetName): GrahaPlacement | null => {
  const p = k.planets.find((x) => x.name === planet);
  if (!p) return null;
  return {
    planet,
    house: p.house,
    rashi: p.rashi,
    relationToSignLord: relationToSignLord(planet, p.rashi.index),
    score: planetHouseScore(planet, p.house),
    rating: PLANET_HOUSE_RATINGS[planet]?.[p.house] ?? "neutral"
  };
};

const analyzeBhava = (k: KundliOutput, house: number): BhavaReading => {
  const signIdx = rashiIndexInHouse(k.lagnaRashi.index, house);
  const rashi = rashiAt(signIdx);
  const lord = signLord(signIdx);
  const lordP = k.planets.find((p) => p.name === lord);
  const lordHouse = lordP?.house ?? house;
  const lordRelation = lordP ? relationToSignLord(lord, lordP.rashi.index) : "sama";
  const lordScore = houseLordPlacementScore(k, house);
  const occupants = k.planets
    .filter((p) => p.house === house)
    .map((p) => grahaPlacement(k, p.name)!)
    .filter(Boolean);
  const occScore = occupants.reduce((s, o) => s + o.score, 0);
  return {
    house,
    rashi,
    lord,
    lordHouse,
    lordRelation,
    lordScore,
    occupants,
    netScore: lordScore + occScore
  };
};

const relationPhrase = (t: TFunction, rel: GrahaPlacement["relationToSignLord"]): string =>
  t(`reading.relation.${rel}` as "reading.relation.mitra");

const fmtHouse = (t: TFunction, h: number): string => t("reading.houseN", { n: h });

const dashaContext = (
  k: KundliOutput,
  birth: { birthDate: string; birthTime: string; latitude: number; longitude: number } | undefined,
  t: TFunction
): { age: number | null; maha: PlanetName | null; bhukti: PlanetName | null } => {
  if (!birth?.birthDate || !birth.birthTime) {
    return { age: null, maha: null, bhukti: null };
  }
  const age = ageDecimalYearsAt(birth.birthDate, birth.birthTime, birth.latitude, birth.longitude, new Date());
  if (!Number.isFinite(age) || age < 0) {
    return { age: null, maha: null, bhukti: null };
  }
  const vb = findBhuktiAtAge(k, age);
  return {
    age,
    maha: vb?.maha.planet ?? null,
    bhukti: vb?.bhukti ?? null
  };
};

const jobHints = (k: KundliOutput, t: TFunction): string[] => {
  const hints: string[] = [];
  const add = (planet: PlanetName, key: string) => {
    const ins = planetHouseInsight(k, planet);
    if (ins && ins.score >= 1) hints.push(t(`reading.jobs.${key}` as "reading.jobs.mercury"));
  };
  add(PN.Mercury, "mercury");
  add(PN.Jupiter, "jupiter");
  add(PN.Mars, "mars");
  add(PN.Venus, "venus");
  add(PN.Saturn, "saturn");
  add(PN.Sun, "sun");
  const lord10 = signLord(rashiIndexInHouse(k.lagnaRashi.index, 10));
  const l10 = grahaPlacement(k, lord10);
  if (l10 && l10.score >= 0) {
    hints.push(t("reading.jobs.tenthLord", { lord: planetT(t, lord10), house: l10.house }));
  }
  return hints.slice(0, 4);
};

const collectCautions = (k: KundliOutput, dosha: DoshaLifeReport, t: TFunction): string[] => {
  const out: string[] = [];
  for (const p of TARA) {
    const g = grahaPlacement(k, p);
    if (g && (g.house === 6 || g.house === 8 || g.house === 12) && g.score <= -1) {
      out.push(
        t("reading.caution.dusthana", {
          planet: planetT(t, p),
          house: g.house
        })
      );
    }
  }
  if (dosha.doshaFlags.hasKaalsarp) out.push(t("reading.caution.kaalsarp"));
  if (dosha.doshaFlags.hasSarpa) out.push(t("reading.caution.sarpa"));
  if (dosha.doshaFlags.hasPitru) out.push(t("reading.caution.pitru"));
  if (dosha.doshaFlags.hasGuruChandal) out.push(t("reading.caution.guruChandal"));
  return out.slice(0, 5);
};

const collectStrengths = (k: KundliOutput, t: TFunction): string[] => {
  const out: string[] = [];
  for (const p of TARA) {
    const g = grahaPlacement(k, p);
    if (g && g.score >= 2) {
      out.push(
        t("reading.strength.strong", {
          planet: planetT(t, p),
          house: g.house,
          houseLabel: fmtHouse(t, g.house),
          relation: relationPhrase(t, g.relationToSignLord)
        })
      );
    }
  }
  const lagnaLord = signLord(k.lagnaRashi.index);
  const ll = grahaPlacement(k, lagnaLord);
  if (ll && ll.score >= 0) {
    out.push(
      t("reading.strength.lagnaLord", {
        lord: planetT(t, lagnaLord),
        house: ll.house,
        houseLabel: fmtHouse(t, ll.house)
      })
    );
  }
  return out.slice(0, 5);
};

const houseHighlightLines = (predictions: HousePrediction[]): string[] => {
  const sorted = [...predictions].sort((a, b) => b.score - a.score);
  return sorted.slice(0, 4).map((p) => p.prediction);
};

export const generateKundliReading = (
  k: KundliOutput,
  birth: { birthDate: string; birthTime: string; latitude: number; longitude: number } | undefined,
  t: TFunction,
  dosha: DoshaLifeReport,
  lang = "en"
): KundliReading => {
  const houses = Array.from({ length: 12 }, (_, i) => analyzeBhava(k, i + 1));
  const lagnaLord = signLord(k.lagnaRashi.index);
  const lagnaOcc = k.planets.filter((p) => p.house === 1 && p.name !== PN.Rahu && p.name !== PN.Ketu);
  const lagnaLordP = grahaPlacement(k, lagnaLord);
  const dasha = dashaContext(k, birth, t);

  const mahaLabel = dasha.maha ? planetT(t, dasha.maha) : t("reading.unknown");
  const bhuktiLabel = dasha.bhukti ? planetT(t, dasha.bhukti) : t("reading.unknown");

  const ageLine =
    dasha.age != null ? t("reading.overviewLong.age", { age: dasha.age.toFixed(1) }) : "";

  const marriageArea = lifeAreaInsight(k, "marriage");
  const careerArea = lifeAreaInsight(k, "career");
  const healthArea = lifeAreaInsight(k, "health");

  const seventhLord = signLord(rashiIndexInHouse(k.lagnaRashi.index, 7));
  const ven = grahaPlacement(k, PN.Venus);

  const jobs = jobHints(k, t);
  const cautions = collectCautions(k, dosha, t);
  const strengths = collectStrengths(k, t);

  const phaseHintKey =
    dosha.currentScenario.dashaWeight === "supportive"
      ? "reading.overviewLong.phaseSupportive"
      : dosha.currentScenario.dashaWeight === "heavy"
        ? "reading.overviewLong.phaseHeavy"
        : "reading.overviewLong.phaseMixed";
  const phaseHint = t(phaseHintKey as "reading.overviewLong.phaseMixed");

  const intro = t("reading.overviewLong.intro", { rashi: rashiT(t, k.lagnaRashi) });

  const lagnaLine = t("reading.overviewLong.lagna", {
    rashi: rashiT(t, k.lagnaRashi),
    lord: planetT(t, lagnaLord),
    lordHouseLabel: fmtHouse(t, lagnaLordP?.house ?? 1),
    relation: lagnaLordP ? relationPhrase(t, lagnaLordP.relationToSignLord) : relationPhrase(t, "sama"),
    withPlanets:
      lagnaOcc.length > 0
        ? lagnaOcc.map((p) => planetT(t, p.name)).join(", ")
        : t("reading.lagnaAlone")
  });

  const dashaLine =
    dasha.age != null
      ? t("reading.overviewLong.dasha", {
          maha: mahaLabel,
          bhukti: bhuktiLabel,
          phaseHint
        })
      : t("reading.overviewLong.dashaNoAge", { maha: mahaLabel, bhukti: bhuktiLabel, phaseHint });

  const currentPhase = phaseHint;

  const marriage = t(
    marriageArea.score >= 2 ? "reading.marriage.strong" : marriageArea.score <= -2 ? "reading.marriage.care" : "reading.marriage.mixed",
    {
      seventhLord: planetT(t, seventhLord),
      venusHouse: ven?.house ?? 0,
      venusInChart: ven ? fmtHouse(t, ven.house) : t("reading.unknown")
    }
  );

  const fourthLord = signLord(rashiIndexInHouse(k.lagnaRashi.index, 4));
  const moon = grahaPlacement(k, PN.Moon);
  const family = t(
    lifeAreaInsight(k, "self").score >= 1 ? "reading.family.strong" : "reading.family.mixed",
    {
      fourthLord: planetT(t, fourthLord),
      moonHouse: moon?.house ?? 4
    }
  );

  const tenthLord = signLord(rashiIndexInHouse(k.lagnaRashi.index, 10));
  const career = t(
    careerArea.score >= 2 ? "reading.career.strong" : careerArea.score <= -2 ? "reading.career.care" : "reading.career.mixed",
    {
      tenthLord: planetT(t, tenthLord),
      tenthLordHouse: grahaPlacement(k, tenthLord)?.house ?? 10
    }
  );

  const careerJobs =
    jobs.length > 0 ? t("reading.careerJobs", { jobs: jobs.join("; ") }) : t("reading.careerJobsNone");

  const health = t(
    healthArea.score >= 1 ? "reading.health.strong" : healthArea.score <= -1 ? "reading.health.care" : "reading.health.mixed",
    {
      moonHouse: moon?.house ?? 1
    }
  );

  const doshaParts: string[] = [];
  if (dosha.doshaFlags.hasKaalsarp) doshaParts.push(t("reading.dosha.kaalsarp"));
  if (dosha.doshaFlags.hasSarpa) doshaParts.push(t("reading.dosha.sarpa"));
  if (dosha.doshaFlags.hasPitru) doshaParts.push(t("reading.dosha.pitru"));
  if (dosha.doshaFlags.hasGuruChandal) doshaParts.push(t("reading.dosha.guruChandal"));
  const doshaLine =
    doshaParts.length > 0 ? t("reading.doshaSummary", { list: doshaParts.join("; ") }) : t("reading.doshaClear");

  const longevityLine = t("reading.longevity", {
    low: dosha.longevity.lowYears,
    mid: dosha.longevity.midYears,
    high: dosha.longevity.highYears
  });

  const housePredictions = buildHousePredictions(k, houses, t, lang);
  const dashaCautions = generateDashaCautions(k, dasha.age, t);
  const dashaCautionLines = dashaCautions.map((p) => formatDashaCautionLine(p, t));

  return {
    intro,
    lagnaLine,
    ageLine,
    dashaLine,
    currentPhase,
    marriage,
    family,
    career,
    careerJobs,
    health,
    cautions,
    strengths,
    houseNotes: houseHighlightLines(housePredictions),
    housePredictions,
    dashaCautions,
    dashaCautionLines,
    doshaLine,
    longevityLine,
    houses
  };
};
