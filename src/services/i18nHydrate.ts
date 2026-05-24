import i18n from "i18next";
import type { IndicLanguage } from "../core/indicLanguages";
import { normalizeIndicLanguage } from "../core/indicLanguages";
import { translateTexts } from "./translationService";

type JsonNode = string | number | boolean | null | JsonNode[] | { [key: string]: JsonNode };

const SKIP_VALUE = (value: string): boolean =>
  !value.trim() ||
  value.length <= 2 ||
  /VITE_[A-Z_]+/.test(value) ||
  /^https?:\/\//i.test(value) ||
  /\{\{/.test(value);

type FlatEntry = { path: string[]; english: string };

const flattenCompare = (
  enNode: JsonNode,
  targetNode: JsonNode,
  path: string[],
  out: FlatEntry[]
): void => {
  if (typeof enNode === "string") {
    if (typeof targetNode === "string" && enNode === targetNode && !SKIP_VALUE(enNode)) {
      out.push({ path: [...path], english: enNode });
    }
    return;
  }
  if (!enNode || typeof enNode !== "object" || Array.isArray(enNode)) return;
  const targetObj =
    targetNode && typeof targetNode === "object" && !Array.isArray(targetNode)
      ? (targetNode as Record<string, JsonNode>)
      : {};
  for (const [key, enValue] of Object.entries(enNode)) {
    flattenCompare(enValue, targetObj[key], [...path, key], out);
  }
};

const setAtPath = (root: Record<string, JsonNode>, path: string[], value: string): void => {
  let node: Record<string, JsonNode> = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const next = node[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      node[key] = {};
    }
    node = node[key] as Record<string, JsonNode>;
  }
  node[path[path.length - 1]] = value;
};

let hydratePromise: Promise<void> | null = null;
let lastHydratedLang: IndicLanguage | null = null;

/**
 * Fill locale strings that still match English using the translation API, then merge into i18next.
 */
export async function hydrateMissingTranslations(lang: string): Promise<void> {
  const target = normalizeIndicLanguage(lang);
  if (target === "en") return;

  if (lastHydratedLang === target && !hydratePromise) return;
  if (hydratePromise) {
    await hydratePromise;
    if (lastHydratedLang === target) return;
  }

  hydratePromise = (async () => {
    const enBundle = i18n.getResourceBundle("en", "translation") as Record<string, JsonNode> | undefined;
    const targetBundle = i18n.getResourceBundle(target, "translation") as Record<string, JsonNode> | undefined;
    if (!enBundle || !targetBundle) return;

    const missing: FlatEntry[] = [];
    flattenCompare(enBundle, targetBundle, [], missing);
    if (!missing.length) {
      lastHydratedLang = target;
      return;
    }

    const englishTexts = missing.map((m) => m.english);
    const translated = await translateTexts(englishTexts, target);

    const patch: Record<string, JsonNode> = {};
    missing.forEach((entry, i) => {
      setAtPath(patch, entry.path, translated[i] ?? entry.english);
    });

    i18n.addResourceBundle(target, "translation", patch, true, true);
    lastHydratedLang = target;
  })();

  try {
    await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

/** Reset hydration state (tests). */
export const resetTranslationHydration = (): void => {
  hydratePromise = null;
  lastHydratedLang = null;
};
