/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees (UT Julian Day).
 * Calibrated to Drik Panchang / Swiss Ephemeris LAHIRI (23.771759° on 1993-05-31 at JD 2449138.5).
 */
export const lahiriAyanamsaDegrees = (jdUt: number): number => {
  const jd2000 = 2451545.0;
  /** Degrees per day — two-point fit: J2000 ≈ 23.85675°, 1993-05-31 ≈ 23.771759°. */
  const rateDegPerDay = 0.000035311;
  const ayanamsaJ2000 = 23.85675;
  return ayanamsaJ2000 + (jdUt - jd2000) * rateDegPerDay;
};
