/**
 * Fills `insights` in hi/kn/te/ta from English using Google Translate web endpoint (client=gtx).
 * Preserves i18n interpolation tokens like {{name}}, {{count}}, {{planet}}.
 * Run: node scripts/translate-insights-gtx.mjs
 * Requires network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "src", "i18n", "locales");

const TOKEN = /\{\{([^{}]+)\}\}/g;

const protect = (s) => {
  const parts = [];
  const out = s.replace(TOKEN, (_, inner) => {
    const i = parts.length;
    parts.push(inner);
    return `⟦${i}⟧`;
  });
  return { out, parts };
};

const restore = (s, parts) =>
  s.replace(/⟦(\d+)⟧/g, (_, i) => `{{${parts[Number(i)]}}}`);

const translateLine = async (text, tl) => {
  if (!text || typeof text !== "string") return text;
  const { out, parts } = protect(text);
  const q = encodeURIComponent(out);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${q}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${tl}`);
  const data = await res.json();
  const translated = data[0].map((row) => row[0]).join("");
  return restore(translated, parts);
};

const walkStrings = async (node, tl) => {
  if (typeof node === "string") {
    return await translateLine(node, tl);
  }
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) {
      out.push(await walkStrings(item, tl));
      await sleep(80);
    }
    return out;
  }
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = await walkStrings(v, tl);
      await sleep(80);
    }
    return out;
  }
  return node;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const read = (code) => JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), "utf8"));
const write = (code, data) =>
  fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify(data, null, 2) + "\n", "utf8");

const en = read("en");
const insightsEn = en.insights;
if (!insightsEn) throw new Error("en.json missing insights");

const langs = process.argv[2] ? [process.argv[2]] : ["hi", "kn", "te", "ta"];

for (const tl of langs) {
  console.log("Translating insights →", tl, "…");
  const translated = await walkStrings(insightsEn, tl);
  const j = read(tl);
  j.insights = translated;
  write(tl, j);
  console.log("  wrote", tl);
}

console.log("Done.");
