import type { IndicLanguage } from "../core/indicLanguages";
import { googleTranslateTarget, normalizeIndicLanguage } from "../core/indicLanguages";
import { getTranslationCache, setTranslationCache } from "../db/indexedDb";
import { protectPlaceholders, restorePlaceholders } from "./translationPlaceholders";

export class TranslationError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

const hashText = (value: string): string => {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = (h * 33) ^ value.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
};

const cacheId = (target: IndicLanguage, source: string): string =>
  `${target}:${hashText(source)}`;

const translateApiUrl = (): string => {
  const override = import.meta.env.VITE_TRANSLATE_API_URL as string | undefined;
  if (override?.trim()) return override.trim();
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/translate`;
  }
  return "/api/translate";
};

const shouldSkipTranslation = (text: string): boolean => {
  const t = text.trim();
  if (!t) return true;
  if (t.length <= 2) return true;
  if (/^[\d\s.,:;+\-/()%]+$/.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
};

const callTranslateApi = async (
  texts: string[],
  target: IndicLanguage,
  source: IndicLanguage,
  signal?: AbortSignal
): Promise<string[]> => {
  const res = await fetch(translateApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      texts,
      target: googleTranslateTarget(target),
      source: googleTranslateTarget(source)
    }),
    signal
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new TranslationError(raw || res.statusText, res.status);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new TranslationError("Translation API returned invalid JSON", res.status);
  }
  const translations = (parsed as { translations?: unknown }).translations;
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    throw new TranslationError("Translation API response shape mismatch", res.status);
  }
  return translations.map(String);
};

/**
 * Translate one English string to the user's language. Uses IndexedDB cache and `/api/translate`.
 */
export async function translateText(
  text: string,
  targetLang: string,
  opts?: { sourceLang?: IndicLanguage; signal?: AbortSignal }
): Promise<string> {
  const target = normalizeIndicLanguage(targetLang);
  const source = opts?.sourceLang ?? "en";
  if (target === "en" || target === source || shouldSkipTranslation(text)) return text;

  const id = cacheId(target, text);
  const cached = await getTranslationCache(id);
  if (cached) return cached;

  const protectedText = protectPlaceholders(text);
  const [translated] = await callTranslateApi([protectedText.text], target, source, opts?.signal);
  const restored = restorePlaceholders(translated, protectedText.tokens);
  await setTranslationCache(id, target, text, restored);
  return restored;
}

const BATCH_SIZE = 40;

/**
 * Batch translate with cache lookups. Preserves order and placeholder tokens.
 */
export async function translateTexts(
  texts: string[],
  targetLang: string,
  opts?: { sourceLang?: IndicLanguage; signal?: AbortSignal }
): Promise<string[]> {
  const target = normalizeIndicLanguage(targetLang);
  const source = opts?.sourceLang ?? "en";
  if (target === "en" || target === source) return texts;

  const results = new Array<string>(texts.length);
  const pending: { index: number; protectedText: string; tokens: string[]; original: string }[] = [];

  await Promise.all(
    texts.map(async (text, index) => {
      if (shouldSkipTranslation(text)) {
        results[index] = text;
        return;
      }
      const id = cacheId(target, text);
      const cached = await getTranslationCache(id);
      if (cached) {
        results[index] = cached;
        return;
      }
      const { text: protectedText, tokens } = protectPlaceholders(text);
      pending.push({ index, protectedText, tokens, original: text });
    })
  );

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const slice = pending.slice(offset, offset + BATCH_SIZE);
    const apiTexts = slice.map((row) => row.protectedText);
    const translated = await callTranslateApi(apiTexts, target, source, opts?.signal);
    await Promise.all(
      slice.map(async (row, i) => {
        const restored = restorePlaceholders(translated[i] ?? row.protectedText, row.tokens);
        results[row.index] = restored;
        await setTranslationCache(cacheId(target, row.original), target, row.original, restored);
      })
    );
  }

  return texts.map((text, i) => results[i] ?? text);
}
