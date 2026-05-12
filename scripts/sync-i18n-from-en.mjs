/**
 * Ensures hi/kn/te/ta have the same nested keys as en.json.
 * Existing translated strings are preserved; missing keys copy English.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "src", "i18n", "locales");

function syncToEn(template, lang) {
  if (typeof template !== "object" || template === null || Array.isArray(template)) {
    return lang !== undefined ? lang : template;
  }
  if (typeof lang !== "object" || lang === null) lang = {};
  const out = {};
  for (const [k, v] of Object.entries(template)) {
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      out[k] = syncToEn(v, lang[k]);
    } else {
      out[k] = Object.prototype.hasOwnProperty.call(lang, k) ? lang[k] : v;
    }
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
for (const code of ["hi", "kn", "te", "ta"]) {
  const p = path.join(dir, `${code}.json`);
  const lang = JSON.parse(fs.readFileSync(p, "utf8"));
  const merged = syncToEn(en, lang);
  fs.writeFileSync(p, JSON.stringify(merged, null, 2) + "\n", "utf8");
}
console.log("Synced hi, kn, te, ta from en.json");
