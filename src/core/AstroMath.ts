import { NAKSHATRAS, RASHIS, type AyanamsaModel, type Nakshatra, type Rashi } from "./AstroTypes";
import { ayanamsaForModel } from "./Ayanamsa";

export type { AyanamsaModel } from "./AstroTypes";

export const normalizeDegree = (deg: number): number => {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
};

/** Julian Day (UT) from a JavaScript Date that represents a UTC instant. */
export const dateToJulianUt = (d: Date): number => d.getTime() / 86400000 + 2440587.5;

/** Ayanāṃśa (degrees, UT). Default: Drik Gaṇita (True Chitrā / Spica 180°). Pass `lahiri` for older tables. */
export const getAyanamsa = (date: Date, model: AyanamsaModel = "lahiri"): number =>
  ayanamsaForModel(date, model);

const NAK_DEG = 360 / 27;
const PADA_DEG = NAK_DEG / 4;

export const degreeToRashi = (deg: number): Rashi => {
  const normalized = normalizeDegree(deg);
  return RASHIS[Math.floor(normalized / 30)];
};

export const degreeToNakshatra = (deg: number): Nakshatra => {
  const normalized = normalizeDegree(deg);
  const nakIdx = Math.min(26, Math.floor(normalized / NAK_DEG + 1e-12));
  return NAKSHATRAS[nakIdx]!;
};

/** Pada 1–4 within the nakshatra of this sidereal longitude. */
export const degreeToNakshatraPada = (deg: number): 1 | 2 | 3 | 4 => {
  const normalized = normalizeDegree(deg);
  const nakIdx = Math.min(26, Math.floor(normalized / NAK_DEG + 1e-12));
  const nakStart = nakIdx * NAK_DEG;
  const within = Math.min(NAK_DEG - 1e-9, Math.max(0, normalized - nakStart));
  const p = Math.floor(within / PADA_DEG + 1e-12) + 1;
  return Math.min(4, Math.max(1, p)) as 1 | 2 | 3 | 4;
};

export const calculateLocalSiderealTime = (date: Date, longitude: number): number => {
  const jd = dateToJulianUt(date);
  const t = (jd - 2451545.0) / 36525;
  const gst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return normalizeDegree(gst + longitude);
};
