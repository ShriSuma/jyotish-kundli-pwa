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
 * Rāśi kala / amsha within sign: whole degrees 1–30 (common handwritten patrikā style).
 * Maps floor(degree-in-sign) + 1 so 0°–0.99° → 1, 29°–29.99° → 30.
 */
export const rashiAmshaFromDegree = (degree: number): number => {
  const inSign = ((degree % 30) + 30) % 30;
  return Math.min(30, Math.floor(inSign) + 1);
};

export const formatRashiAmsha = (degree: number, lang: string): string =>
  formatChartHouseNumber(rashiAmshaFromDegree(degree), lang);
