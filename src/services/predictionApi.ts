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
  const parsed = JSON.parse(raw) as Partial<PredictionOutput> & { prediction?: PredictionOutput };
  const p = parsed.prediction ?? parsed;
  if (
    typeof p.title !== "string" ||
    typeof p.summary !== "string" ||
    typeof p.career !== "string" ||
    typeof p.finance !== "string" ||
    typeof p.health !== "string" ||
    typeof p.relationships !== "string" ||
    typeof p.rating !== "number" ||
    !p.lucky ||
    typeof p.lucky.color !== "string" ||
    (p.integratedReading != null && typeof p.integratedReading !== "string")
  ) {
    throw new PredictionApiError("API response is not a valid PredictionOutput", res.status);
  }
  return p as PredictionOutput;
}
