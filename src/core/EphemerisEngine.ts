import * as Astronomy from "astronomy-engine";
import { dateToJulianUt, normalizeDegree } from "./AstroMath";
import type { AyanamsaModel, NodeType } from "./AstroTypes";
import { lahiriAyanamsaDegrees } from "./LahiriAyanamsa";
import { trueChitrapakshaAyanamsaDegrees } from "./DrikGanitaAyanamsa";

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

/**
 * Mean longitude of Moon's ascending node (tropical), Meeus AA / PyMeeus coefficients.
 */
export const meanLunarAscendingNodeTropical = (jdUt: number): number => {
  const T = (jdUt - 2451545.0) / 36525.0;
  const Omega =
    125.0445479 +
    T * (-1934.1362891 + T * (0.0020754 + T * (1.0 / 476441.0 - T / 60616000.0)));
  return normalizeDegree(Omega);
};

/**
 * True longitude of Moon's ascending node (tropical), Meeus AA ch 47 (PyMeeus).
 * Rāhu in most modern Indian chart software follows the **true** node; Ketu = Rāhu + 180°.
 */
export const trueLunarAscendingNodeTropical = (jdUt: number): number => {
  const Omega = meanLunarAscendingNodeTropical(jdUt);
  const T = (jdUt - 2451545.0) / 36525.0;
  const D = normalizeDegree(
    297.8501921 + T * (445267.1114034 + T * (-0.0018819 + T * (1.0 / 545868.0 - T / 113065000.0)))
  );
  const M = normalizeDegree(357.5291092 + T * (35999.0502909 + T * (-0.0001536 + T / 24490000.0)));
  const Mp = normalizeDegree(
    134.9633964 + T * (477198.8675055 + T * (0.0087414 + T * (1.0 / 69699.9 + T / 14712000.0)))
  );
  const F = normalizeDegree(
    93.272095 + T * (483202.0175233 + T * (-0.0036539 + T * (-1.0 / 3526000.0 + T / 863310000.0)))
  );
  const Dr = toRad(D);
  const Mr = toRad(M);
  const Mpr = toRad(Mp);
  const Fr = toRad(F);
  const corr =
    -1.4979 * Math.sin(2 * (Dr - Fr)) -
    0.15 * Math.sin(Mr) -
    0.1226 * Math.sin(2 * Dr) +
    0.1176 * Math.sin(2 * Fr) -
    0.0801 * Math.sin(2 * (Mpr - Fr));
  return normalizeDegree(Omega + corr);
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

/** Geocentric apparent sidereal ecliptic longitudes, degrees [0,360). */
export const siderealLongitudes = (
  utc: Date,
  model: AyanamsaModel = "lahiri",
  nodeType: NodeType = "mean"
): SiderealLongitudes => {
  const jdUt = dateToJulianUt(utc);
  const ayanamsa =
    model === "lahiri" ? lahiriAyanamsaDegrees(jdUt) : trueChitrapakshaAyanamsaDegrees(utc);

  const sun = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Sun, utc) - ayanamsa);
  const moon = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Moon, utc) - ayanamsa);
  const mars = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Mars, utc) - ayanamsa);
  const mercury = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Mercury, utc) - ayanamsa);
  const jupiter = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Jupiter, utc) - ayanamsa);
  const venus = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Venus, utc) - ayanamsa);
  const saturn = normalizeDegree(tropicalGeoLongitude(Astronomy.Body.Saturn, utc) - ayanamsa);
  const nodeTropical =
    nodeType === "true" ? trueLunarAscendingNodeTropical(jdUt) : meanLunarAscendingNodeTropical(jdUt);
  const rahu = normalizeDegree(nodeTropical - ayanamsa);
  const ketu = normalizeDegree(rahu + 180);

  return { jdUt, ayanamsa, sun, moon, mars, mercury, jupiter, venus, saturn, rahu, ketu };
};
