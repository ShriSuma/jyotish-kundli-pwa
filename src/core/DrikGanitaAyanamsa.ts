import * as Astronomy from "astronomy-engine";

const norm360 = (deg: number): number => {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
};

let spicaBound = false;

/** Spica (α Vir, Chitrā) in J2000 EQJ — sidereal hours / degrees per astronomy-engine DefineStar. */
const bindSpica = (): void => {
  if (spicaBound) return;
  const raHours = 13 + 25 / 60 + 11.5793 / 3600;
  const decDeg = -(11 + 9 / 60 + 40.75 / 3600);
  Astronomy.DefineStar(Astronomy.Body.Star1, raHours, decDeg, 260);
  spicaBound = true;
};

/** Apparent tropical ecliptic longitude of Spica (°), geocentric. */
export const spicaTropicalEclipticLongitude = (utc: Date): number => {
  bindSpica();
  const v = Astronomy.GeoVector(Astronomy.Body.Star1, utc, true);
  return norm360(Astronomy.Ecliptic(v).elon);
};

/**
 * Drik Gaṇita sidereal anchor: **True Chitrāpakṣa** — Spica at exactly 180° nirāyana.
 * Matches the observational (drik) convention used in many official Indian ephemerides
 * (distinct from the linear Lahiri/Chitrapaksha tabular value at J2000).
 */
export const trueChitrapakshaAyanamsaDegrees = (utc: Date): number => {
  const trop = spicaTropicalEclipticLongitude(utc);
  return norm360(trop - 180);
};
