/**
 * Merge gotra translations into kn/hi/te/ta locale files from bundled map.
 * Run: node scripts/merge-gotras-i18n.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const map = JSON.parse(readFileSync(`${root}/src/data/gotrasI18n.json`, "utf8"));

for (const loc of ["kn", "hi", "te", "ta"]) {
  const path = `${root}/src/i18n/locales/${loc}.json`;
  const data = JSON.parse(readFileSync(path, "utf8"));
  const gotras = {};
  for (const [id, labels] of Object.entries(map)) {
    gotras[id] = labels[loc] ?? labels.en;
  }
  data.gotras = gotras;
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Merged ${Object.keys(gotras).length} gotras → ${loc}.json`);
}
