import SunCalc from "suncalc";
import { calculateLocalSiderealTime, degreeToRashi, normalizeDegree } from "./AstroMath";

/** Weekday 0=Sun … 6=Sat → 1-based segment index (1..8) for Gulika/Maandi start after sunrise (common table). */
const GULIKA_START_SEGMENT: Record<number, number> = {
  0: 6,
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
  6: 7
};

const ascendantFromLstApprox = (lstDeg: number, latitude: number): number => {
  const latFactor = Math.sin((latitude * Math.PI) / 180) * 15;
  return normalizeDegree(lstDeg + latFactor);
};

/**
 * Approximate Maandi (Gulika) ecliptic degree: ascendant at midpoint of the Gulika daytime segment.
 * Simplified display aid; full panchanga-grade Maandi needs professional ephemeris.
 */
export const computeMaandi = (
  birthLocal: Date,
  latitude: number,
  longitude: number
): { degree: number; rashi: ReturnType<typeof degreeToRashi>; windowLabel: string } => {
  const times = SunCalc.getTimes(birthLocal, latitude, longitude);
  const sunrise = times.sunrise.getTime();
  const sunset = times.sunset.getTime();
  const dayMs = Math.max(1, sunset - sunrise);
  const segMs = dayMs / 8;
  const seg = GULIKA_START_SEGMENT[birthLocal.getDay()] ?? 1;
  const startMs = sunrise + (seg - 1) * segMs;
  const midMs = startMs + segMs / 2;
  const mid = new Date(midMs);
  const lst = calculateLocalSiderealTime(mid, longitude);
  const deg = ascendantFromLstApprox(lst, latitude);
  const startClock = new Date(startMs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const endClock = new Date(startMs + segMs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return {
    degree: deg,
    rashi: degreeToRashi(deg),
    windowLabel: `${startClock}–${endClock}`
  };
};
