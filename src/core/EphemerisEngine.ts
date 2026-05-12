import * as Astronomy from "astronomy-engine";
import { dateToJulianUt, normalizeDegree } from "./AstroMath";
import { lahiriAyanamsaDegrees } from "./LahiriAyanamsa";

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Mean obliquity of the ecliptic (degrees), Meeus AA ch 22. */
export const meanObliquityDegrees = (jdUt: number): number => {
  const T = (jdUt - 2451545.0) / 36525.0;
  const sec = 84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return sec / 3600.0;
};

/**
 * Tropical ecliptic longitude of ascendant (geometric), degrees [0,360).
 * RAMC = local sidereal time in degrees (same convention as calculateLocalSiderealTime).
 */
export const ascendantTropicalDegrees = (ramcDeg: number, latDeg: number, obliquityDeg: number): number => {
  const ramc = toRad(ramcDeg);
  const eps = toRad(obliquityDeg);
  const phi = toRad(latDeg);
  const y = Math.cos(ramc);
  const x = -(Math.cos(eps) * Math.sin(ramc) + Math.sin(eps) * Math.tan(phi));
  return normalizeDegree((Math.atan2(y, x) * 180) / Math.PI);
};

const tropicalGeoLongitude = (body: Astronomy.Body, date: Date): number => {
  if (body === Astronomy.Body.Sun) {
    return normalizeDegree(Astronomy.SunPosition(date).elon);
  }
  if (body === Astronomy.Body.Moon) {
    return normalizeDegree(Astronomy.EclipticGeoMoon(date).lon);
  }
  const v = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(v);
  return normalizeDegree(ecl.elon);
};

/** Meeus AA: mean longitude of Moon's ascending node on the ecliptic, tropical degrees. */
const meanLunarNodeTropical = (jdUt: number): number => {
  const T = (jdUt - 2451545.0) / 36525.0;
  const deg = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 450000.0;
  return normalizeDegree(deg);
};

export type SiderealLongitudes = {
  jdUt: number;
  ayanamsa: number;
  sun: number;
  moon: number;
  mars: number;
  mercury: number;
  jupiter: number;
  venus: number;
  saturn: number;
  rahu: number;
  ketu: number;
};

/** Geocentric apparent sidereal ecliptic longitudes (Lahiri), degrees [0,360). */
export const siderealLongitudes = (utc: Date): SiderealLongitudes => {
  const jdUt = dateToJulianUt(utc);
  const ayanamsa = lahiriAyanamsaDegrees(jdUt);

  const sun = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Sun, utc) - ayanamsa);
  const moon = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Moon, utc) - ayanamsa);
  const mars = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Mars, utc) - ayanamsa);
  const mercury = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Mercury, utc) - ayanamsa);
  const jupiter = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Jupiter, utc) - ayanamsa);
  const venus = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Venus, utc) - ayanamsa);
  const saturn = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Saturn, utc) - ayanamsa);
  const rahu = normalizeDegree(meanLunarNodeTropical(jdUt) - ayanamsa);
  const ketu = normalizeDegree(rahu + 180);

  return { jdUt, ayanamsa, sun, moon, mars, mercury, jupiter, venus, saturn, rahu, ketu };
};
