import type { PredictionOutput } from "../core/AstroTypes";
import type { IndicLanguage } from "../core/indicLanguages";
import { normalizeIndicLanguage } from "../core/indicLanguages";
import { translateText, translateTexts } from "./translationService";

const predictionStringFields = [
  "title",
  "summary",
  "career",
  "finance",
  "health",
  "relationships",
  "integratedReading",
  "dashaLine",
  "timingLine"
] as const;

/** True when API returned English while UI language is Indian. */
export const predictionNeedsLocalization = (
  prediction: PredictionOutput,
  lang: string
): boolean => {
  const target = normalizeIndicLanguage(lang);
  if (target === "en") return false;
  const sample = prediction.summary || prediction.title || "";
  return /[a-zA-Z]{4,}/.test(sample);
};

/**
 * Ensure prediction sections read naturally in hi/kn/te/ta (API fallback or English cache).
 */
export async function localizePredictionOutput(
  prediction: PredictionOutput,
  lang: string,
  opts?: { signal?: AbortSignal }
): Promise<PredictionOutput> {
  const target = normalizeIndicLanguage(lang);
  if (target === "en") return prediction;

  const fields = predictionStringFields.filter((key) => {
    const v = prediction[key];
    return typeof v === "string" && v.trim().length > 0;
  });

  const originals = fields.map((key) => prediction[key] as string);
  const translated = await translateTexts(originals, target, opts);

  const next: PredictionOutput = { ...prediction };
  fields.forEach((key, i) => {
    next[key] = translated[i];
  });

  if (prediction.lucky) {
    const luckyParts = [prediction.lucky.color, prediction.lucky.direction];
    const luckyTranslated = await translateTexts(luckyParts, target, opts);
    next.lucky = {
      ...prediction.lucky,
      color: luckyTranslated[0],
      direction: luckyTranslated[1]
    };
  }

  return next;
}

/** Translate free-form narrative from optional backend. */
export async function localizeNarrativeText(
  text: string,
  lang: string,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const target = normalizeIndicLanguage(lang);
  if (target === "en" || !text.trim()) return text;
  return translateText(text, target, opts);
}

export type { IndicLanguage };
