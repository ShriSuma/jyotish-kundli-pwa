/**
 * Hindu (madhyabimb) sunrise/sunset — center of the solar disk at the horizon.
 * Matches Drik Panchang / patrikā almanacs (not upper-limb astronomical times).
 *
 * At Indian latitudes this is typically ~2–4 minutes after astronomical sunrise
 * and ~2–4 minutes before astronomical sunset.
 */
export const hinduSunriseSunsetFromAstronomical = (
  sunrise: Date,
  sunset: Date,
  latitude: number
): { sunrise: Date; sunset: Date } => {
  const lat = Math.abs(latitude);
  /** Semidiameter + refraction correction in minutes (latitude-aware). */
  const corrMin = lat < 8 ? 3.5 : lat < 25 ? 3.0 : lat < 35 ? 2.5 : 2.0;
  const ms = Math.round(corrMin * 60_000);
  return {
    sunrise: new Date(sunrise.getTime() + ms),
    sunset: new Date(sunset.getTime() - ms)
  };
};

/** Use Hindu disk times for Indian births; astronomical elsewhere. */
export const resolveSunTimesForJyotish = (
  astronomical: { sunrise: Date; sunset: Date },
  lat: number,
  lng: number,
  pincode = ""
): { sunrise: Date; sunset: Date; mode: "hindu" | "astronomical" } => {
  const india =
    /^[1-9]\d{5}$/.test(pincode.trim()) || (lat >= 4 && lat <= 40 && lng >= 64 && lng <= 99);
  if (!india) return { ...astronomical, mode: "astronomical" };
  const h = hinduSunriseSunsetFromAstronomical(astronomical.sunrise, astronomical.sunset, lat);
  return { ...h, mode: "hindu" };
};
