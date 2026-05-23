import type { PlaceSunTimes } from "./birthSunTimes";
import { vedicWeekdayAtBirth } from "./birthSunTimes";
import { calculateLocalSiderealTime, dateToJulianUt, degreeToRashi, getAyanamsa, normalizeDegree } from "./AstroMath";
import type { AyanamsaModel } from "./AstroTypes";
import { ascendantTropicalDegrees, meanObliquityDegrees } from "./EphemerisEngine";
import { formatClockAtPlace } from "./placeTime";
/**
 * Weekday 0=Sun … 6=Sat → 1-based segment index (1..8) for Gulika/Maandi start after sunrise.
 * Matches common panchānga tables (e.g. Sunday 7th eighth … Saturday 8th eighth).
 */
const GULIKA_START_SEGMENT: Record<number, number> = {
  0: 7,
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 8
};

/**
 * Maandi (Gulika) ecliptic degree: sidereal ascendant early in the Gulika daytime segment
 * (common panchānga eighth from sunrise; a small offset from segment open matches many patrikās better than midpoint).
 * Uses the same ascendant model as KundliEngine (obliquity + RAMC) with the chosen ayanāṃśa.
 */
export const computeMaandi = (
  birthUtc: Date,
  latitude: number,
  longitude: number,
  pincode = "",
  ayanamsaModel: AyanamsaModel = "lahiri",
  sunTimes?: PlaceSunTimes
): { degree: number; rashi: ReturnType<typeof degreeToRashi>; windowLabel: string } => {
  if (!sunTimes) {
    throw new Error("computeMaandi requires birthplace sunrise/sunset (resolveBirthSunTimes)");
  }
  const sunrise = sunTimes.sunrise.getTime();
  const sunset = sunTimes.sunset.getTime();
  const dayMs = Math.max(1, sunset - sunrise);
  const segMs = dayMs / 8;
  const wd = vedicWeekdayAtBirth(birthUtc, sunTimes.sunrise, latitude, longitude);
  const seg = GULIKA_START_SEGMENT[wd] ?? 1;
  const startMs = sunrise + (seg - 1) * segMs;
  /** Ascendant early in Gulika segment (≈5% after open; midpoint overshoots many handwritten patrikās). */
  const maandiMs = startMs + segMs * 0.008;
  const mid = new Date(maandiMs);
  const jd = dateToJulianUt(mid);
  const lst = calculateLocalSiderealTime(mid, longitude);
  const eps = meanObliquityDegrees(jd);
  const ascTropical = ascendantTropicalDegrees(lst, latitude, eps);
  const ayan = getAyanamsa(mid, ayanamsaModel);
  const deg = normalizeDegree(ascTropical - ayan);
  const startClock = formatClockAtPlace(new Date(startMs), "en-IN", latitude, longitude, pincode);
  const endClock = formatClockAtPlace(new Date(startMs + segMs), "en-IN", latitude, longitude, pincode);
  return {
    degree: deg,
    rashi: degreeToRashi(deg),
    windowLabel: `${startClock}–${endClock}`
  };
};
