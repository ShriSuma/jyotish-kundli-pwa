import type { KundliOutput } from "../core/AstroTypes";
import { buildChartFactSheet } from "../core/PersonalizedNarrativeEngine";

export type NarrativeChartSummary = {
  lang: string;
  name?: string;
  birthDate: string;
  birthTime: string;
  lagnaSanskrit: string;
  moonSignSanskrit: string;
  moonPada: number;
  sunSignSanskrit: string;
  planets: Array<{ name: string; house: number; rashiSanskrit: string }>;
};

export const buildNarrativeSummary = (
  input: { name?: string; birthDate: string; birthTime: string },
  kundli: KundliOutput,
  lang: string
): NarrativeChartSummary => ({
  lang,
  name: input.name,
  birthDate: input.birthDate,
  birthTime: input.birthTime,
  lagnaSanskrit: kundli.lagnaRashi.sanskrit,
  moonSignSanskrit: kundli.moonSign.sanskrit,
  moonPada: kundli.moonPada,
  sunSignSanskrit: kundli.sunSign.sanskrit,
  planets: kundli.planets.map((p) => ({
    name: p.name,
    house: p.house,
    rashiSanskrit: p.rashi.sanskrit
  }))
});

export class NarrativeApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * POSTs a compact chart summary to your backend. Configure `VITE_NARRATIVE_API_URL`
 * and optionally `VITE_NARRATIVE_API_KEY` (browser keys are only for prototypes).
 * Expects JSON `{ "narrative": "..." }` or plain text body.
 */
export async function fetchKundliNarrative(
  body: NarrativeChartSummary,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const url = import.meta.env.VITE_NARRATIVE_API_URL as string | undefined;
  if (!url) {
    throw new NarrativeApiError("Missing VITE_NARRATIVE_API_URL", 0);
  }
  const key = import.meta.env.VITE_NARRATIVE_API_KEY as string | undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain;q=0.9"
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
    headers["X-Api-Key"] = key;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: opts?.signal
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new NarrativeApiError(raw || res.statusText, res.status);
  }
  try {
    const parsed = JSON.parse(raw) as { narrative?: string; text?: string; message?: string };
    if (typeof parsed.narrative === "string") return parsed.narrative;
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    /* plain text */
  }
  return raw.trim();
}

const narrativeApiBase = (): string | undefined => {
  const url = import.meta.env.VITE_NARRATIVE_API_URL as string | undefined;
  if (url) return url.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/api/kundli-narrative";
  return undefined;
};

/**
 * Optional AI polish for 12 bhāva sentences. Uses VITE_NARRATIVE_API_URL or dev /api/kundli-narrative
 * when GEMINI_API_KEY or OPENAI_API_KEY is set on the server.
 */
export async function fetchHouseNarrativesPolish(
  kundli: KundliOutput,
  lang: string,
  opts?: { signal?: AbortSignal }
): Promise<string[]> {
  const base = narrativeApiBase();
  if (!base) {
    throw new NarrativeApiError("Missing narrative API URL", 0);
  }
  const factSheet = buildChartFactSheet(kundli, lang);
  const key = import.meta.env.VITE_NARRATIVE_API_KEY as string | undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
    headers["X-Api-Key"] = key;
  }
  const res = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ factSheet, lang }),
    signal: opts?.signal
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new NarrativeApiError(raw || res.statusText, res.status);
  }
  const parsed = JSON.parse(raw) as { houses?: string[] };
  if (!Array.isArray(parsed.houses) || parsed.houses.length !== 12) {
    throw new NarrativeApiError("Invalid houses array in response", res.status);
  }
  return parsed.houses.map(String);
}
