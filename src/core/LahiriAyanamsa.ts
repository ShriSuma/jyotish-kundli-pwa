/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees (UT Julian Day).
 * Linear model anchored at J2000 to match Swiss Ephemeris LAHIRI within ~0.02° (1950–2050).
 * Full nutation-sensitive tables would require Swiss Ephemeris; this is a strong browser-safe default.
 */
export const lahiriAyanamsaDegrees = (jdUt: number): number => {
  const jd2000 = 2451545.0;
  const ayanamsaJ2000 = 23.8541667;
  const arcsecPerTropicalYear = 50.290966;
  const degPerDay = arcsecPerTropicalYear / 3600 / 365.242191;
  return ayanamsaJ2000 + (jdUt - jd2000) * degPerDay;
};
