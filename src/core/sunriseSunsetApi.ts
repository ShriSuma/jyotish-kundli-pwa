/**
 * Official-style sunrise/sunset from sunrise-sunset.org (USNO-backed, widely used).
 * Browser calls same-origin `/api/sunrise-sunset?...` (Vite proxy in dev, Vercel rewrite in prod) to avoid CORS.
 */

import type { PanchangOutput } from "./AstroTypes";
import { formatClockAtPlace } from "./placeTime";

type ApiBody = {
  status: string;
  results?: { sunrise: string; sunset: string };
};

const buildQuery = (lat: number, lng: number, ymd: string): string =>
  new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    date: ymd,
    formatted: "0"
  }).toString();

export const sunriseSunsetRequestUrl = (lat: number, lng: number, ymd: string): string => {
  const q = buildQuery(lat, lng, ymd);
  if (import.meta.env.MODE === "test") {
    return `https://api.sunrise-sunset.org/json?${q}`;
  }
  return `/api/sunrise-sunset?${q}`;
};

export type SunriseSunsetUtc = { sunrise: Date; sunset: Date };

/** Returns null if network error or API not OK (caller should fall back to SunCalc). */
export const fetchSunriseSunsetUtc = async (
  lat: number,
  lng: number,
  ymd: string
): Promise<SunriseSunsetUtc | null> => {
  try {
    const url = sunriseSunsetRequestUrl(lat, lng, ymd);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as ApiBody;
    if (data.status !== "OK" || !data.results?.sunrise || !data.results?.sunset) return null;
    const sunrise = new Date(data.results.sunrise);
    const sunset = new Date(data.results.sunset);
    if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) return null;
    return { sunrise, sunset };
  } catch {
    return null;
  }
};

/** Overwrite Panchang sunrise/sunset labels using authoritative instants (API or SunCalc). */
export const applySunTimesToPanchang = (
  base: PanchangOutput,
  times: { sunrise: Date; sunset: Date },
  locale: string,
  lat: number,
  lng: number,
  pincode = ""
): PanchangOutput => ({
  ...base,
  sunrise: formatClockAtPlace(times.sunrise, locale, lat, lng, pincode),
  sunset: formatClockAtPlace(times.sunset, locale, lat, lng, pincode)
});
