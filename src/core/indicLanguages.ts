/** UI and translation target languages supported by the app. */
export type IndicLanguage = "en" | "hi" | "kn" | "te" | "ta";

export const INDIC_LANGUAGES: IndicLanguage[] = ["en", "hi", "kn", "te", "ta"];

export const isIndicLanguage = (value: string): value is IndicLanguage =>
  (INDIC_LANGUAGES as string[]).includes(value.split("-")[0]);

/** Normalize browser / i18next codes to our supported set. */
export const normalizeIndicLanguage = (value: string): IndicLanguage => {
  const base = value.split("-")[0];
  return isIndicLanguage(base) ? base : "en";
};

/** Google Cloud Translation API target codes (same as our locale ids). */
export const googleTranslateTarget = (lang: IndicLanguage): string => lang;
