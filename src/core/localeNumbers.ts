import { normalizeDegree } from "./AstroMath";
import { navamsaSignIndex } from "./Navamsa";

/** Decimal degrees within sign [0, 30). */
export const degreeInSign = (degree: number): number => {
  const d = normalizeDegree(degree);
  return ((d % 30) + 30) % 30;
};

const formatTwoIntsLocale = (a: number, b: number, lang: string): string => {
  const base = lang.split("-")[0] ?? lang;
  const fmt = (n: number) => {
    if (base === "kn") {
      try {
        return n.toLocaleString("kn-IN", { numberingSystem: "knda" });
      } catch {
        /* fall through */
      }
    }
    if (base === "hi") {
      try {
        return n.toLocaleString("hi-IN", { numberingSystem: "deva" });
      } catch {
        /* fall through */
      }
    }
    if (base === "te") {
      try {
        return n.toLocaleString("te-IN", { numberingSystem: "telu" });
      } catch {
        /* fall through */
      }
    }
    if (base === "ta") {
      try {
        return n.toLocaleString("ta-IN", { numberingSystem: "tamldec" });
      } catch {
        /* fall through */
      }
    }
    return String(n);
  };
  return `${fmt(a)}°${fmt(b)}′`;
};

/**
 * Rāśi-bhāga: degrees and whole minutes within the sign (0°0′ … 29°59′).
 * Matches how many South Indian patrikās print "ಅಂಶ" beside the rāśi.
 */
export const formatRashiBhaaga = (degree: number, lang: string): string => {
  const ins = degreeInSign(degree);
  const totalMin = Math.min(1799, Math.floor(ins * 60 + 1e-9));
  const deg = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return formatTwoIntsLocale(deg, min, lang);
};

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
  const inSign = degreeInSign(degree);
  /** Stable bucket for dwādaśāṁśa (avoids 29.999… vs 30 edge cases). */
  const idx = Math.min(11, Math.floor(inSign / 2.5 + 1e-12));
  return idx + 1;
};

/**
 * Navāṁśa (D-9) pada within the rāśi — **1–9**, each 3°20′ (30°÷9).
 */
export const navamsaPadaFromDegree = (degree: number): number => {
  const inSign = degreeInSign(degree);
  const idx = Math.min(8, Math.floor((inSign * 9) / 30 + 1e-12));
  return idx + 1;
};

/**
 * Patrikā chart bracket (Karnataka): **navāṁśa rāśi 1–12** (Parāśari D-9 sign), not pada.
 * Matches handwritten charts (e.g. Shukra 1, Ravi 2, Budha 7, Kuja 10, Chandra 3).
 */
export const patrikaNavamshaFromDegree = (degree: number): number => navamsaSignIndex(degree) + 1;

/** Maandi/Gulika on patrikā charts often prints D-1 rāśi number (1–12). */
export const patrikaMaandiBracket = (rashiIndex: number): number => rashiIndex + 1;

/** @deprecated Use patrikaNavamshaFromDegree for chart brackets. */
export const patrikaAmshaFromDegree = (degree: number): number => {
  const inSign = degreeInSign(degree);
  const whole = Math.floor(inSign + 1e-9);
  if (whole === 0) return inSign > 1e-6 ? 1 : 0;
  return whole;
};

export const formatRashiAmsha = (degree: number, lang: string): string =>
  formatChartHouseNumber(rashiAmshaFromDegree(degree), lang);

export const formatNavamsaPada = (degree: number, lang: string): string =>
  formatChartHouseNumber(navamsaPadaFromDegree(degree), lang);

/** Patrikā chart cell: whole degree + navāṁśa + dwādaśāṁśa — `(16|5|7)` style. */
export const formatPatrikaAmshaTriple = (degree: number, lang: string): string => {
  const deg = formatChartHouseNumber(patrikaAmshaFromDegree(degree), lang);
  const nav = formatChartHouseNumber(navamsaPadaFromDegree(degree), lang);
  const d12 = formatChartHouseNumber(rashiAmshaFromDegree(degree), lang);
  return `(${deg}|${nav}|${d12})`;
};

/** Patrikā / chart: navāṁśa pada (1–9) in parentheses — Karnataka patrikā style. */
export const formatPatrikaAmshaOnly = (degree: number, lang: string): string =>
  `(${formatChartHouseNumber(patrikaNavamshaFromDegree(degree), lang)})`;

/** Format ghaṭī and vighaṭī with locale digits (notebook / patrikā style). */
export const formatGhatiVighati = (ghati: number, vighati: number, lang: string): string =>
  `${formatChartHouseNumber(ghati, lang)}-${formatChartHouseNumber(vighati, lang)}`;

/** @deprecated Use formatPatrikaAmshaOnly — navāṁśa pada brackets. */
export const formatPatrikaNavamsaOnly = formatPatrikaAmshaOnly;
