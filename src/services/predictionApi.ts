import type { PredictionOutput } from "../core/AstroTypes";

export type PredictionApiBody = {
  lang: string;
  period: "daily" | "weekly" | "monthly";
  periodKey: string;
  name?: string;
  kundliSummary: {
    lagnaSanskrit: string;
    moonSignSanskrit: string;
    moonPada: number;
    dashaMaha?: string;
    dashaBhukti?: string;
    ageYears?: number;
  };
};

export class PredictionApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const coerceLucky = (raw: unknown): PredictionOutput["lucky"] | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const color = asString(o.color);
  const direction = asString(o.direction);
  const number = asNumber(o.number, 1);
  if (!color || !direction) return null;
  return { color, number, direction };
};

const coercePredictionOutput = (parsed: unknown): PredictionOutput | null => {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  const inner = (p.prediction && typeof p.prediction === "object" ? p.prediction : p) as Record<string, unknown>;

  const title = asString(inner.title);
  const summary = asString(inner.summary);
  const career = asString(inner.career);
  const finance = asString(inner.finance);
  const health = asString(inner.health);
  const relationships = asString(inner.relationships);
  const rating = asNumber(inner.rating, 3);
  const lucky = coerceLucky(inner.lucky);

  if (!title || !summary || !career || !finance || !health || !relationships || !lucky) return null;

  const out: PredictionOutput = {
    title,
    summary,
    career,
    finance,
    health,
    relationships,
    lucky,
    rating
  };

  if (typeof inner.integratedReading === "string" && inner.integratedReading.trim()) {
    out.integratedReading = inner.integratedReading;
  }
  if (typeof inner.dashaLine === "string" && inner.dashaLine.trim()) {
    out.dashaLine = inner.dashaLine;
  }
  if (typeof inner.timingLine === "string" && inner.timingLine.trim()) {
    out.timingLine = inner.timingLine;
  }

  return out;
};

/**
 * Optional richer readings. Set `VITE_PREDICTION_API_URL` and POST JSON body
 * `PredictionApiBody`. Expect JSON matching `PredictionOutput` (all string fields).
 */
export async function fetchPredictionFromApi(
  body: PredictionApiBody,
  opts?: { signal?: AbortSignal }
): Promise<PredictionOutput> {
  const url = import.meta.env.VITE_PREDICTION_API_URL as string | undefined;
  if (!url) {
    throw new PredictionApiError("Missing VITE_PREDICTION_API_URL", 0);
  }
  const key = import.meta.env.VITE_PREDICTION_API_KEY as string | undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
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
    throw new PredictionApiError(raw || res.statusText, res.status);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new PredictionApiError("API response is not valid JSON", res.status);
  }
  const coerced = coercePredictionOutput(parsed);
  if (!coerced) {
    throw new PredictionApiError("API response is not a usable PredictionOutput (check title, summary, lucky, etc.)", res.status);
  }
  return coerced;
}
