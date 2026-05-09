import type { TFunction } from "i18next";
import type { KundliOutput, PredictionOutput } from "./AstroTypes";

const weekdayLords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

type Tone = "positive" | "neutral" | "caution";

const moonTone = (kundli: KundliOutput): Tone => {
  const moon = kundli.planets.find((p) => p.name === "Moon");
  if (moon && moon.house <= 4) return "positive";
  if (moon && moon.house <= 8) return "neutral";
  return "caution";
};

const buildLucky = (tone: Tone, kundli: KundliOutput, t: TFunction): PredictionOutput["lucky"] => ({
  color: t(`predictions.lucky.${tone}.color`),
  number: (Math.floor(kundli.ascendant) % 9) + 1,
  direction: t(`predictions.lucky.${tone}.direction`)
});

const applyTone = (
  tone: Tone,
  kundli: KundliOutput,
  t: TFunction,
  personName: string | undefined,
  planetLabel: string,
  rating: number
): PredictionOutput => {
  const name = (personName?.trim() || t("predictions.seeker")) as string;
  const moonRashi = t(`rashis.${kundli.moonSign.sanskrit}` as "rashis.Mesha");
  const planet = planetLabel;
  const base = `predictions.tones.${tone}`;
  return {
    title: t(`${base}.title`),
    summary: t(`${base}.summary`, { name, moonRashi, planet }),
    career: t(`${base}.career`),
    finance: t(`${base}.finance`),
    health: t(`${base}.health`),
    relationships: t(`${base}.relationships`),
    lucky: buildLucky(tone, kundli, t),
    rating
  };
};

export const getDailyPrediction = (
  kundli: KundliOutput,
  date: Date,
  t: TFunction,
  personName?: string
): PredictionOutput => {
  const tone = moonTone(kundli);
  const lord = weekdayLords[date.getDay()] ?? "Sun";
  const rating = tone === "positive" ? 5 : tone === "neutral" ? 3 : 2;
  const planetLabel = t(`planets.${lord}` as "planets.Sun");
  return applyTone(tone, kundli, t, personName, planetLabel, rating);
};

export const getWeeklyPrediction = (
  kundli: KundliOutput,
  startDate: Date,
  t: TFunction,
  personName?: string
): PredictionOutput => {
  const base = Math.floor((startDate.getTime() / 86400000) % 7);
  const score = Array.from({ length: 7 }, (_, i) => ((base + i + kundli.moonSign.index) % 5) + 1).reduce(
    (a, b) => a + b,
    0
  );
  const avg = Math.round(score / 7);
  const tone: Tone = avg >= 4 ? "positive" : avg >= 3 ? "neutral" : "caution";
  const planetLabel = t("predictions.focus.moonTransit");
  return applyTone(tone, kundli, t, personName, planetLabel, avg);
};

export const getMonthlyPrediction = (
  kundli: KundliOutput,
  year: number,
  month: number,
  t: TFunction,
  personName?: string
): PredictionOutput => {
  const sunTheme = (year + month + kundli.sunSign.index) % 3;
  const tone: Tone = sunTheme === 0 ? "positive" : sunTheme === 1 ? "neutral" : "caution";
  const rating = tone === "positive" ? 4 : tone === "neutral" ? 3 : 2;
  const planetLabel = t("predictions.focus.sunTransit");
  return applyTone(tone, kundli, t, personName, planetLabel, rating);
};
