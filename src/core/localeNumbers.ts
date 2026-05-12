import { normalizeDegree } from "./AstroMath";

/** Format small integers for chart labels (e.g. Kannada digits when supported). */
export const formatChartHouseNumber = (n: number, lang: string): string => {
  const v = Math.round(n);
  const base = lang.split("-")[0] ?? lang;
  if (base === "kn") {
    try {
      return v.toLocaleString("kn-IN", { numberingSystem: "knda" });
    } catch {
      /* fall through */
    }
  }
  if (base === "hi") {
    try {
      return v.toLocaleString("hi-IN", { numberingSystem: "deva" });
    } catch {
      /* fall through */
    }
  }
  if (base === "te") {
    try {
      return v.toLocaleString("te-IN", { numberingSystem: "telu" });
    } catch {
      /* fall through */
    }
  }
  if (base === "ta") {
    try {
      return v.toLocaleString("ta-IN", { numberingSystem: "tamldec" });
    } catch {
      /* fall through */
    }
  }
  return String(v);
};

/**
 * Rāśy-amsha as 1–12: dwādaśāṁśa index (twelfth-part of the sign), each 2.5° wide.
 * Boundaries: [0°,2.5°)→1 … [27.5°,30°)→12 (matches common patrikā numbering).
 */
export const rashiAmshaFromDegree = (degree: number): number => {
  const d = normalizeDegree(degree);
  const inSign = ((d % 30) + 30) % 30;
  /** Stable bucket for dwādaśāṁśa (avoids 29.999… vs 30 edge cases). */
  const idx = Math.min(11, Math.floor(inSign / 2.5 + 1e-12));
  return idx + 1;
};

export const formatRashiAmsha = (degree: number, lang: string): string =>
  formatChartHouseNumber(rashiAmshaFromDegree(degree), lang);
