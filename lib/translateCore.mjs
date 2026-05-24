/**
 * Shared English → Indian language translation for Vercel `/api/translate` and Vite dev proxy.
 * Prefers Google Cloud Translation API v2 when GOOGLE_TRANSLATE_API_KEY is set; otherwise gtx.
 */

const TOKEN = /\{\{([^{}]+)\}\}/g;
const MARKER = /⟦(\d+)⟧/g;

const protect = (s) => {
  const parts = [];
  const out = s.replace(TOKEN, (_, inner) => {
    const i = parts.length;
    parts.push(inner);
    return `⟦${i}⟧`;
  });
  return { out, parts };
};

const restore = (s, parts) => s.replace(MARKER, (_, i) => `{{${parts[Number(i)]}}}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const translateGtxOne = async (text, target, source = "en") => {
  const { out, parts } = protect(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(out)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gtx HTTP ${res.status}`);
  const data = await res.json();
  const joined = data[0].map((row) => row[0]).join("");
  return restore(joined, parts);
};

const translateGoogleCloud = async (texts, target, source, apiKey) => {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, target, source, format: "text" })
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}: ${raw.slice(0, 200)}`);
  const parsed = JSON.parse(raw);
  const rows = parsed?.data?.translations;
  if (!Array.isArray(rows) || rows.length !== texts.length) {
    throw new Error("Google Translate response shape mismatch");
  }
  return rows.map((row) => row.translatedText ?? "");
};

/**
 * @param {string[]} texts
 * @param {string} target
 * @param {string} [source]
 * @returns {Promise<string[]>}
 */
export async function translateTextsServer(texts, target, source = "en") {
  if (target === source || target === "en" && source === "en") return texts;
  const cleaned = texts.map((t) => (typeof t === "string" ? t : String(t ?? "")));
  if (cleaned.every((t) => !t.trim())) return cleaned;

  const protectedRows = cleaned.map((t) => protect(t));
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();

  if (apiKey) {
    const payloads = protectedRows.map((p) => p.out);
    const translated = await translateGoogleCloud(payloads, target, source, apiKey);
    return translated.map((row, i) => restore(row, protectedRows[i].parts));
  }

  const out = [];
  for (let i = 0; i < protectedRows.length; i++) {
    out.push(await translateGtxOne(cleaned[i], target, source));
    if (i < protectedRows.length - 1) await sleep(60);
  }
  return out;
}
