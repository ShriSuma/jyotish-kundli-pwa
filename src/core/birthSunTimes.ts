import SunCalc from "suncalc";
import { inferBirthTimezoneIana } from "./birthTime";
import { resolveSunTimesForJyotish } from "./hinduSunTimes";
import { fetchSunriseSunsetUtc, type SunriseSunsetUtc } from "./sunriseSunsetApi";
import {
  calendarYmdForPanchangPin,
  calendarYmdInTimeZone,
  panchangClockTimeZone,
  weekdayInTimeZone
} from "./placeTime";

export type PlaceSunTimes = SunriseSunsetUtc & { source: "api" | "suncalc" };

/** Noon on the birth civil day at the birthplace (IST for India PIN / bbox). */
export const solarNoonAnchorForBirth = (birthUtc: Date, lat: number, lng: number, pincode = ""): Date => {
  const tz = inferBirthTimezoneIana(lat, lng);
  const ymd = calendarYmdInTimeZone(birthUtc, tz);
  if (tz === "Asia/Kolkata") {
    return new Date(`${ymd}T12:00:00+05:30`);
  }
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

/** SunCalc sunrise/sunset for the birth civil day (sync fallback), Hindu disk corrected. */
export const sunTimesSyncForBirth = (
  birthUtc: Date,
  lat: number,
  lng: number,
  pincode = ""
): PlaceSunTimes => {
  const anchor = solarNoonAnchorForBirth(birthUtc, lat, lng, pincode);
  const times = SunCalc.getTimes(anchor, lat, lng);
  const jyotish = resolveSunTimesForJyotish(
    { sunrise: times.sunrise, sunset: times.sunset },
    lat,
    lng,
    pincode
  );
  return { sunrise: jyotish.sunrise, sunset: jyotish.sunset, source: "suncalc" };
};

/**
 * Authoritative sunrise/sunset at the birth place for the birth civil date
 * (USNO-style API when available, else SunCalc on local solar-noon anchor).
 */
export const resolveBirthSunTimes = async (
  birthUtc: Date,
  lat: number,
  lng: number,
  pincode = ""
): Promise<PlaceSunTimes> => {
  const ymd = calendarYmdForPanchangPin(birthUtc, lat, lng, pincode);
  const api = await fetchSunriseSunsetUtc(lat, lng, ymd);
  if (api) {
    const jyotish = resolveSunTimesForJyotish(api, lat, lng, pincode);
    return { sunrise: jyotish.sunrise, sunset: jyotish.sunset, source: "api" };
  }
  return sunTimesSyncForBirth(birthUtc, lat, lng, pincode);
};

/**
 * Weekday for Gulika/Maandi and similar rules: on the Hindu day at the place,
 * birth before sunrise belongs to the previous weekday (Sun=0 … Sat=6).
 */
export const vedicWeekdayAtBirth = (birthUtc: Date, sunrise: Date, lat: number, lng: number): number => {
  const tz = inferBirthTimezoneIana(lat, lng);
  if (birthUtc.getTime() < sunrise.getTime()) {
    const prev = new Date(birthUtc.getTime() - 86_400_000);
    return weekdayInTimeZone(prev, tz);
  }
  return weekdayInTimeZone(birthUtc, tz);
};

export const birthPlaceClockTz = (lat: number, lng: number, pincode = ""): string =>
  panchangClockTimeZone(lat, lng, pincode);
