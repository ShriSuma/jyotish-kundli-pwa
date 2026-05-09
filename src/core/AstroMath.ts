import { NAKSHATRAS, RASHIS, type Nakshatra, type Rashi } from "./AstroTypes";

export const normalizeDegree = (deg: number): number => {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
};

export const toJulianDate = (date: Date, time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0, 0)
  );
  return utcDate.getTime() / 86400000 + 2440587.5;
};

export const getAyanamsa = (date: Date): number => {
  const year = date.getUTCFullYear();
  const base = 23.85;
  return base + (year - 2026) * 0.0139;
};

export const degreeToRashi = (deg: number): Rashi => {
  const normalized = normalizeDegree(deg);
  return RASHIS[Math.floor(normalized / 30)];
};

export const degreeToNakshatra = (deg: number): Nakshatra => {
  const normalized = normalizeDegree(deg);
  return NAKSHATRAS[Math.floor(normalized / (360 / 27))];
};

const NAK_DEG = 360 / 27;
const PADA_DEG = NAK_DEG / 4;

/** Pada 1–4 within the nakshatra of this sidereal longitude. */
export const degreeToNakshatraPada = (deg: number): 1 | 2 | 3 | 4 => {
  const normalized = normalizeDegree(deg);
  const within = normalized % NAK_DEG;
  const p = Math.floor(within / PADA_DEG) + 1;
  return Math.min(4, Math.max(1, p)) as 1 | 2 | 3 | 4;
};

export const calculateLocalSiderealTime = (date: Date, longitude: number): number => {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525;
  const gst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return normalizeDegree(gst + longitude);
};

