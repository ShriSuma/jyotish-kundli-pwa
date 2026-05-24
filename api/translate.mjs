import { translateTextsServer } from "../lib/translateCore.mjs";

const ALLOWED = new Set(["en", "hi", "kn", "te", "ta"]);

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });

/** Vercel serverless: POST { texts: string[], target: string, source?: string } */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    const body = await readJsonBody(req);
    const texts = Array.isArray(body.texts) ? body.texts.map(String) : [];
    const target = String(body.target ?? "").split("-")[0];
    const source = String(body.source ?? "en").split("-")[0];

    if (!texts.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "texts array required" }));
    }
    if (!ALLOWED.has(target)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "unsupported target language" }));
    }
    if (texts.length > 80) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "max 80 strings per request" }));
    }

    const translations = await translateTextsServer(texts, target, source);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    return res.end(JSON.stringify({ translations, provider: process.env.GOOGLE_TRANSLATE_API_KEY ? "google" : "gtx" }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
  }
}
