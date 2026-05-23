import { normalizeDegree } from "./AstroMath";

const NAV_SPAN = 30 / 9;

/** Navāṁśa sign index 0–11 (Parāśara: movable / fixed / dual offsets). */
export const navamsaSignIndex = (siderealDeg: number): number => {
  const d = normalizeDegree(siderealDeg);
  const sign = Math.floor(d / 30);
  const inSign = d - sign * 30;
  const n = Math.min(8, Math.floor(inSign / NAV_SPAN + 1e-12));
  const tri = sign % 3;
  const offset = tri === 0 ? 0 : tri === 1 ? 8 : 4;
  return (sign + offset + n) % 12;
};

/** Full D-9 sidereal longitude (degrees [0,360)). */
export const navamsaLongitude = (siderealDeg: number): number => {
  const d = normalizeDegree(siderealDeg);
  const sign = Math.floor(d / 30);
  const inSign = d - sign * 30;
  const n = Math.min(8, Math.floor(inSign / NAV_SPAN + 1e-12));
  const navSign = navamsaSignIndex(siderealDeg);
  const remInDiv = inSign - n * NAV_SPAN;
  const degInNavSign = (remInDiv / NAV_SPAN) * 30;
  return normalizeDegree(navSign * 30 + degInNavSign);
};
