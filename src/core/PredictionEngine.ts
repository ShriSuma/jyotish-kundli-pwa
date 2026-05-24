import type { TFunction } from "i18next";
import type { AyanamsaModel, KundliOutput, PlanetName, PredictionOutput } from "./AstroTypes";
import { PlanetName as PN } from "./AstroTypes";
import { siderealLongitudes } from "./EphemerisEngine";
import { degreeToRashi, normalizeDegree } from "./AstroMath";
import { ageDecimalYearsAt } from "./birthTime";
import { findBhuktiAtAge } from "./DashaBhuktiEngine";
import { lifeAreaInsight, natalHousePredictionSignal, planetHouseScore } from "./ChartPredictionKnowledge";
import { computeDoshaLifeReport } from "./DoshaLifeEngine";

const weekdayLords: PlanetName[] = [PN.Sun, PN.Moon, PN.Mars, PN.Mercury, PN.Jupiter, PN.Venus, PN.Saturn];

export type PredictionBirthContext = {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  /** Matches chart / panchānga sidereal anchor (default Lahiri). */
  ayanamsaModel?: AyanamsaModel;
};

type Tone = "positive" | "neutral" | "caution";

const moonTone = (kundli: KundliOutput): Tone => {
  const moon = kundli.planets.find((p) => p.name === PN.Moon);
  if (moon && moon.house <= 4) return "positive";
  if (moon && moon.house <= 8) return "neutral";
  return "caution";
};

const natalHouseOfPlanet = (kundli: KundliOutput, lord: PlanetName): number | undefined =>
  kundli.planets.find((p) => p.name === lord)?.house;

const isKendra = (h: number): boolean => h === 1 || h === 4 || h === 7 || h === 10;

const noonUtcForCalendarDate = (d: Date): Date =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));

const buildLucky = (tone: Tone, kundli: KundliOutput, t: TFunction): PredictionOutput["lucky"] => ({
  color: t(`predictions.lucky.${tone}.color`),
  number: (Math.floor(kundli.ascendant) % 9) + 1,
  direction: t(`predictions.lucky.${tone}.direction`)
});

const scoreToneFromSignals = (signals: number): Tone => {
  if (signals >= 2) return "positive";
  if (signals >= 0) return "neutral";
  return "caution";
};

const rashiTKey = (sanskrit: string): string => `rashis.${sanskrit.replace(/\s+/g, "")}`;

const vimshottariContext = (
  kundli: KundliOutput,
  at: Date,
  birth: PredictionBirthContext | undefined,
  t: TFunction
): { ageYears: number; dashaLine: string; timingLine: string } | null => {
  if (!birth) return null;
  const ageYears = ageDecimalYearsAt(birth.birthDate, birth.birthTime, birth.latitude, birth.longitude, at);
  if (ageYears < 0) return null;
  const vb = findBhuktiAtAge(kundli, ageYears);
  if (!vb) {
    return {
      ageYears,
      dashaLine: t("predictions.dashaUnknown"),
      timingLine: t("predictions.timingGeneric")
    };
  }
  const mahaL = t(`planets.${vb.maha.planet}` as "planets.Moon");
  const bhuktiL = t(`planets.${vb.bhukti}` as "planets.Moon");
  return {
    ageYears,
    dashaLine: t("predictions.dashaLineTemplate", { maha: mahaL, bhukti: bhuktiL }),
    timingLine: t("predictions.timingFromTransits", {
      age: ageYears.toFixed(1),
      maha: mahaL,
      bhukti: bhuktiL
    })
  };
};

const transitMoonSignIndex = (date: Date, model: AyanamsaModel): number => {
  const moonDeg = siderealLongitudes(noonUtcForCalendarDate(date), model).moon;
  return degreeToRashi(moonDeg).index;
};

/** Smallest separation 0–180° between two ecliptic longitudes. */
const angularSep = (degA: number, degB: number): number => {
  const a = normalizeDegree(degA);
  const b = normalizeDegree(degB);
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
};

const nearAspect = (sep: number, target: number, orb = 8): boolean => Math.abs(sep - target) <= orb;

/** Extra signals from sidereal transits at local noon vs natal Moon / Lagna. */
const transitGeometrySignals = (kundli: KundliOutput, date: Date, model: AyanamsaModel): number => {
  let s = 0;
  const longs = siderealLongitudes(noonUtcForCalendarDate(date), model);
  const moonNatal = kundli.planets.find((p) => p.name === PN.Moon)?.degree ?? kundli.ascendant;
  const lagnaDeg = kundli.ascendant;

  const pairs: Array<{ tr: number; benefic: boolean }> = [
    { tr: longs.jupiter, benefic: true },
    { tr: longs.venus, benefic: true },
    { tr: longs.mercury, benefic: true },
    { tr: longs.saturn, benefic: false },
    { tr: longs.mars, benefic: false }
  ];
  for (const { tr, benefic } of pairs) {
    const sepM = angularSep(tr, moonNatal);
    if (nearAspect(sepM, 0, 9) || nearAspect(sepM, 120, 9) || nearAspect(sepM, 60, 6)) s += benefic ? 1 : -1;
    if (nearAspect(sepM, 90, 7) || nearAspect(sepM, 180, 8)) s += benefic ? 0 : -1;
  }

  const sunSep = angularSep(longs.sun, lagnaDeg);
  if (nearAspect(sunSep, 0, 10) || nearAspect(sunSep, 120, 10)) s += 1;
  if (nearAspect(sunSep, 90, 8) || nearAspect(sunSep, 180, 10)) s -= 1;

  const moonTransitSep = angularSep(longs.moon, moonNatal);
  if (nearAspect(moonTransitSep, 0, 6)) s += 1;

  return s;
};

const buildIntegratedReading = (
  period: "daily" | "weekly" | "monthly",
  tone: Tone,
  kundli: KundliOutput,
  t: TFunction,
  personName: string | undefined,
  planetLabel: string,
  birth: PredictionBirthContext | undefined,
  at: Date,
  model: AyanamsaModel
): string => {
  const name = (personName?.trim() || t("predictions.seeker")) as string;
  const moonRashi = t(rashiTKey(kundli.moonSign.sanskrit) as "rashis.Mesha");
  const longs = siderealLongitudes(noonUtcForCalendarDate(at), model);
  const transitMoon = t(rashiTKey(degreeToRashi(longs.moon).sanskrit) as "rashis.Mesha");
  let maha = t("predictions.na");
  let bhukti = t("predictions.na");
  if (birth) {
    const ageYears = ageDecimalYearsAt(birth.birthDate, birth.birthTime, birth.latitude, birth.longitude, at);
    if (ageYears >= 0) {
      const vb = findBhuktiAtAge(kundli, ageYears);
      if (vb) {
        maha = t(`planets.${vb.maha.planet}` as "planets.Sun");
        bhukti = t(`planets.${vb.bhukti}` as "planets.Sun");
      }
    }
  }
  const periodKey =
    period === "daily" ? "predictions.periodToday" : period === "weekly" ? "predictions.periodWeek" : "predictions.periodMonth";
  return t(`predictions.integrated.${tone}`, {
    name,
    moonRashi,
    planet: planetLabel,
    transitMoon,
    maha,
    bhukti,
    period: t(periodKey)
  }) + doshaReadingSuffix(kundli, t);
};

const doshaReadingSuffix = (kundli: KundliOutput, t: TFunction): string => {
  const report = computeDoshaLifeReport(kundli);
  const parts: string[] = [];
  if (report.doshaFlags.hasKaalsarp && report.kaalsarp.kind === "full") {
    parts.push(t("predictions.doshaNote.kaalsarpFull"));
  } else if (report.doshaFlags.hasKaalsarp) {
    parts.push(t("predictions.doshaNote.kaalsarpPartial"));
  }
  if (report.doshaFlags.hasSarpa) parts.push(t("predictions.doshaNote.sarpa"));
  if (report.doshaFlags.hasPitru) parts.push(t("predictions.doshaNote.pitru"));
  if (report.doshaFlags.hasGuruChandal) parts.push(t("predictions.doshaNote.guruChandal"));
  if (!parts.length) return "";
  return ` ${t("predictions.doshaNote.prefix")} ${parts.join(" ")} ${t("predictions.doshaNote.contact", { phone: "9972339362" })}`;
};

const applyTone = (
  tone: Tone,
  kundli: KundliOutput,
  t: TFunction,
  personName: string | undefined,
  planetLabel: string,
  rating: number,
  extras?: { dashaLine?: string; timingLine?: string; integratedReading?: string }
): PredictionOutput => {
  const name = (personName?.trim() || t("predictions.seeker")) as string;
  const moonRashi = t(`rashis.${kundli.moonSign.sanskrit}` as "rashis.Mesha");
  const base = `predictions.tones.${tone}`;
  return {
    title: t(`${base}.title`),
    summary: t(`${base}.summary`, { name, moonRashi, planet: planetLabel }),
    career: t(`${base}.career`),
    finance: t(`${base}.finance`),
    health: t(`${base}.health`),
    relationships: t(`${base}.relationships`),
    lucky: buildLucky(tone, kundli, t),
    rating,
    dashaLine: extras?.dashaLine,
    timingLine: extras?.timingLine,
    integratedReading: extras?.integratedReading
  };
};

export const getDailyPrediction = (
  kundli: KundliOutput,
  date: Date,
  t: TFunction,
  personName?: string,
  birth?: PredictionBirthContext
): PredictionOutput => {
  const model = birth?.ayanamsaModel ?? "lahiri";
  const baseTone = moonTone(kundli);
  const dow = date.getDay();
  const lord = weekdayLords[dow] ?? PN.Sun;
  const planetLabel = t(`planets.${lord}` as "planets.Sun");

  let signals = baseTone === "positive" ? 1 : baseTone === "neutral" ? 0 : -1;
  const wh = natalHouseOfPlanet(kundli, lord);
  if (wh && isKendra(wh)) signals += 1;
  if (wh && (wh === 6 || wh === 8 || wh === 12)) signals -= 1;
  if (wh) signals += Math.round(planetHouseScore(lord, wh) / 2);
  signals += Math.round(natalHousePredictionSignal(kundli, lord) / 2);

  const careerArea = lifeAreaInsight(kundli, "career");
  const marriageArea = lifeAreaInsight(kundli, "marriage");
  if (careerArea.score >= 2) signals += 1;
  if (marriageArea.score <= -2) signals -= 1;

  const tm = transitMoonSignIndex(date, model);
  const diff = (tm - kundli.moonSign.index + 12) % 12;
  if (diff === 0 || diff === 3 || diff === 4 || diff === 6 || diff === 8 || diff === 11) signals += 1;
  if (diff === 2 || diff === 5 || diff === 7) signals -= 1;

  signals += Math.max(-2, Math.min(2, transitGeometrySignals(kundli, date, model)));

  const vim = vimshottariContext(kundli, date, birth, t);
  if (vim) {
    const benefic: PlanetName[] = [PN.Jupiter, PN.Venus, PN.Mercury, PN.Moon];
    const slice = findBhuktiAtAge(kundli, vim.ageYears);
    if (slice && benefic.includes(slice.bhukti)) signals += 1;
    if (slice && (slice.bhukti === PN.Saturn || slice.bhukti === PN.Rahu || slice.bhukti === PN.Ketu)) signals -= 1;
    if (slice && benefic.includes(slice.maha.planet)) signals += 1;
  }

  const tone = scoreToneFromSignals(signals);
  const rating = tone === "positive" ? 5 : tone === "neutral" ? 4 : 2;
  const extras = vim ? { dashaLine: vim.dashaLine, timingLine: vim.timingLine } : undefined;
  const integratedReading = buildIntegratedReading("daily", tone, kundli, t, personName, planetLabel, birth, date, model);
  return applyTone(tone, kundli, t, personName, planetLabel, rating, { ...extras, integratedReading });
};

export const getWeeklyPrediction = (
  kundli: KundliOutput,
  startDate: Date,
  t: TFunction,
  personName?: string,
  birth?: PredictionBirthContext
): PredictionOutput => {
  const model = birth?.ayanamsaModel ?? "lahiri";
  let signals = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dayPred = getDailyPrediction(
      kundli,
      d,
      t,
      personName,
      birth ? { ...birth, ayanamsaModel: model } : undefined
    );
    signals += dayPred.rating - 3;
  }
  const tone = scoreToneFromSignals(signals);
  const rating = Math.min(5, Math.max(1, Math.round(3 + signals / 7)));
  const mid = new Date(startDate);
  mid.setDate(mid.getDate() + 3);
  const vim = vimshottariContext(kundli, mid, birth, t);
  const extras = vim ? { dashaLine: vim.dashaLine, timingLine: t("predictions.weekTimingHint") } : undefined;
  const integratedReading = buildIntegratedReading(
    "weekly",
    tone,
    kundli,
    t,
    personName,
    t("predictions.focus.moonTransit"),
    birth,
    mid,
    model
  );
  return applyTone(tone, kundli, t, personName, t("predictions.focus.moonTransit"), rating, {
    ...extras,
    integratedReading
  });
};

export const getMonthlyPrediction = (
  kundli: KundliOutput,
  year: number,
  month: number,
  t: TFunction,
  personName?: string,
  birth?: PredictionBirthContext
): PredictionOutput => {
  const model = birth?.ayanamsaModel ?? "lahiri";
  const mid = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  const sunIdx = degreeToRashi(siderealLongitudes(mid, model).sun).index;
  const relation = (sunIdx - kundli.sunSign.index + 12) % 12;
  let signals = moonTone(kundli) === "positive" ? 1 : 0;
  if (relation === 0 || relation === 3 || relation === 6 || relation === 9) signals += 1;
  if (relation === 1 || relation === 2 || relation === 5 || relation === 7) signals -= 1;

  signals += Math.max(-2, Math.min(2, transitGeometrySignals(kundli, mid, model)));

  const vim = vimshottariContext(kundli, mid, birth, t);
  if (vim) {
    const slice = findBhuktiAtAge(kundli, vim.ageYears);
    if (slice?.maha.planet === PN.Jupiter || slice?.maha.planet === PN.Venus) signals += 1;
  }

  const tone = scoreToneFromSignals(signals);
  const rating = tone === "positive" ? 4 : tone === "neutral" ? 3 : 2;
  const extras = vim
    ? { dashaLine: vim.dashaLine, timingLine: t("predictions.monthTimingHint", { month: String(month) }) }
    : undefined;
  const integratedReading = buildIntegratedReading(
    "monthly",
    tone,
    kundli,
    t,
    personName,
    t("predictions.focus.sunTransit"),
    birth,
    mid,
    model
  );
  return applyTone(tone, kundli, t, personName, t("predictions.focus.sunTransit"), rating, {
    ...extras,
    integratedReading
  });
};
