const LANG_NAMES = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  te: "Telugu",
  ta: "Tamil"
};

const buildHousePrompt = (factSheet, lang) => {
  const langName = LANG_NAMES[lang] ?? "English";
  const lines = factSheet.houses
    .map(
      (h) =>
        `House ${h.house}: sign ${h.signIndex + 1}, grahas ${h.grahas.map((g) => `${g.name}(navamsha ${g.amshaNav})`).join(", ") || "none"}, lord ${h.lord}`
    )
    .join("\n");
  return `You are a compassionate Vedic astrologer writing for a lay reader (not experts).
Lagna: ${factSheet.lagna}. Write in ${langName} only.

Chart (whole-sign houses from Lagna):
${lines}

Return strict JSON only: { "houses": [ "sentence for house 1", ... 12 strings ] }.
Each sentence: 2-4 short sentences, plain language, mention grahas and navamsha amsha numbers when present, no jargon without explanation, no duplicate openings, warm tone.`;
};

async function callOpenAI(prompt, apiKey, model) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: "Reply with valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  return text;
}

async function callGemini(prompt, apiKey, model) {
  const m = model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6 }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

const parseHouseJson = (raw) => {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  const arr = parsed.houses ?? parsed.narratives;
  if (!Array.isArray(arr) || arr.length !== 12) {
    throw new Error("Expected JSON { houses: string[12] }");
  }
  return arr.map(String);
};

/** @param {object} factSheet @param {string} lang @param {NodeJS.ProcessEnv|Record<string,string>} env */
export async function generateHouseNarrativesServer(factSheet, lang, env = process.env) {
  const code = String(lang ?? "en").split("-")[0];
  const prompt = buildHousePrompt(factSheet, code);
  let raw = "";
  if (env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY) {
    raw = await callGemini(prompt, env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY, env.GEMINI_MODEL);
  } else if (env.OPENAI_API_KEY) {
    raw = await callOpenAI(prompt, env.OPENAI_API_KEY, env.OPENAI_MODEL);
  } else {
    throw new Error("No GEMINI_API_KEY or OPENAI_API_KEY configured on server");
  }
  return parseHouseJson(raw);
}
