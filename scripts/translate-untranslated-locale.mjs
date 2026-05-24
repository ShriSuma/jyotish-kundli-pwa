/**
 * Batch-translate locale keys that still match English into hi/kn/te/ta JSON files.
 * Uses Google Cloud when GOOGLE_TRANSLATE_API_KEY is set; otherwise gtx (dev quality).
 *
 * Usage:
 *   node scripts/translate-untranslated-locale.mjs kn
 *   node scripts/translate-untranslated-locale.mjs        # all indic langs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translateTextsServer } from "../lib/translateCore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "src", "i18n", "locales");

const SKIP = (value) =>
  !value?.trim() ||
  value.length <= 2 ||
  /VITE_[A-Z_]+/.test(value) ||
  /^https?:\/\//i.test(value);

const walk = (enNode, targetNode, pathKeys, out) => {
  if (typeof enNode === "string") {
    if (typeof targetNode === "string" && enNode === targetNode && !SKIP(enNode)) {
      out.push({ pathKeys: [...pathKeys], english: enNode });
    }
    return;
  }
  if (!enNode || typeof enNode !== "object" || Array.isArray(enNode)) return;
  const targetObj =
    targetNode && typeof targetNode === "object" && !Array.isArray(targetNode) ? targetNode : {};
  for (const [key, value] of Object.entries(enNode)) {
    walk(value, targetObj[key], [...pathKeys, key], out);
  }
};

const setAtPath = (root, pathKeys, value) => {
  let node = root;
  for (let i = 0; i < pathKeys.length - 1; i++) {
    const key = pathKeys[i];
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  node[pathKeys[pathKeys.length - 1]] = value;
};

const read = (code) => JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), "utf8"));
const write = (code, data) =>
  fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify(data, null, 2) + "\n", "utf8");

const en = read("en");
const langs = process.argv[2] ? [process.argv[2]] : ["hi", "kn", "te", "ta"];

for (const lang of langs.filter(Boolean)) {
  const locale = read(lang);
  const missing = [];
  walk(en, locale, [], missing);
  if (!missing.length) {
    console.log(lang, "— nothing to translate");
    continue;
  }
  console.log(lang, "— translating", missing.length, "strings…");
  const BATCH = 40;
  for (let i = 0; i < missing.length; i += BATCH) {
    const slice = missing.slice(i, i + BATCH);
    const translated = await translateTextsServer(
      slice.map((m) => m.english),
      lang,
      "en"
    );
    slice.forEach((entry, j) => setAtPath(locale, entry.pathKeys, translated[j] ?? entry.english));
  }
  write(lang, locale);
  console.log("  wrote", lang);
}

console.log("Done.");
