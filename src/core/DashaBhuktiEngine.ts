import { PlanetName, type KundliOutput } from "./AstroTypes";
import { normalizeDegree } from "./AstroMath";

const dashaOrder = [
  PlanetName.Ketu,
  PlanetName.Venus,
  PlanetName.Sun,
  PlanetName.Moon,
  PlanetName.Mars,
  PlanetName.Rahu,
  PlanetName.Jupiter,
  PlanetName.Saturn,
  PlanetName.Mercury
] as const;

export const dashaYears: Record<PlanetName, number> = {
  [PlanetName.Ketu]: 7,
  [PlanetName.Venus]: 20,
  [PlanetName.Sun]: 6,
  [PlanetName.Moon]: 10,
  [PlanetName.Mars]: 7,
  [PlanetName.Rahu]: 18,
  [PlanetName.Jupiter]: 16,
  [PlanetName.Saturn]: 19,
  [PlanetName.Mercury]: 17
};

const NAK_SPAN = 360 / 27;

/** Moon’s nakṣatra index (0–26) and progress within it, aligned with Vimśottari boundaries. */
const moonNakshatraSlice = (moonDegNorm: number): { nakIdx: number; degInNak: number } => {
  let nakIdx = Math.min(26, Math.floor(moonDegNorm / NAK_SPAN));
  const nakStart = nakIdx * NAK_SPAN;
  let degInNak = moonDegNorm - nakStart;
  if (degInNak < 0) degInNak += NAK_SPAN;
  if (degInNak >= NAK_SPAN - 1e-9) {
    nakIdx = (nakIdx + 1) % 27;
    degInNak = 0;
  }
  return { nakIdx, degInNak };
};

export type DashaEntry = {
  planet: PlanetName;
  startAge: number;
  endAge: number;
  durationYears: number;
};

export type BhuktiSpan = {
  maha: PlanetName;
  bhukti: PlanetName;
  startAge: number;
  endAge: number;
  durationYears: number;
};

/** Remaining years in the birth nakshatra’s starting mahadasha (Vimshottari). */
export const vimshottariBalanceAtBirth = (kundli: KundliOutput): { lord: PlanetName; balanceYears: number } => {
  const moon = kundli.planets.find((p) => p.name === PlanetName.Moon);
  const moonDeg = normalizeDegree(moon?.degree ?? 0);
  const { nakIdx, degInNak } = moonNakshatraSlice(moonDeg);
  const fraction = Math.min(1, Math.max(0, degInNak / NAK_SPAN));
  const startLordIdx = nakIdx % dashaOrder.length;
  const lord = dashaOrder[startLordIdx]!;
  const totalYears = dashaYears[lord];
  const elapsedYears = fraction * totalYears;
  const balanceYears = Math.max(0, totalYears - elapsedYears);
  return { lord, balanceYears };
};

/**
 * Mahadasha timeline from birth with correct first-period balance.
 * Continues until cumulative age reaches `maxAgeYears` (default 120).
 */
export const generateDashaTimeline = (kundli: KundliOutput, maxAgeYears = 120): DashaEntry[] => {
  const moon = kundli.planets.find((p) => p.name === PlanetName.Moon);
  const moonDeg = normalizeDegree(moon?.degree ?? 0);
  const { nakIdx: moonNakIdx } = moonNakshatraSlice(moonDeg);
  const startIdx = moonNakIdx % dashaOrder.length;
  const { balanceYears, lord: firstLord } = vimshottariBalanceAtBirth(kundli);

  const timeline: DashaEntry[] = [];
  let age = 0;

  const push = (planet: PlanetName, duration: number) => {
    const d = Number(duration.toFixed(6));
    if (d <= 0) return;
    const start = Number(age.toFixed(6));
    age += d;
    const end = Number(age.toFixed(6));
    timeline.push({ planet, startAge: start, endAge: end, durationYears: d });
  };

  push(firstLord, balanceYears);
  let idx = (startIdx + 1) % dashaOrder.length;

  let guard = 0;
  while (age < maxAgeYears - 1e-6 && guard < 80) {
    const planet = dashaOrder[idx]!;
    push(planet, dashaYears[planet]);
    idx = (idx + 1) % dashaOrder.length;
    guard += 1;
  }

  return timeline;
};

/** Nine antardashas inside one mahadasha (durations sum to mahadasha years). */
export const generateBhuktisInMahadasha = (mahaPlanet: PlanetName): Array<{ planet: PlanetName; years: number }> => {
  const mahaYears = dashaYears[mahaPlanet];
  const startIdx = dashaOrder.indexOf(mahaPlanet);
  const out: Array<{ planet: PlanetName; years: number }> = [];
  for (let k = 0; k < 9; k += 1) {
    const b = dashaOrder[(startIdx + k) % dashaOrder.length]!;
    const y = (mahaYears * dashaYears[b]) / 120;
    out.push({ planet: b, years: y });
  }
  return out;
};

export const findMahadashaAtAge = (kundli: KundliOutput, ageYears: number): DashaEntry | undefined => {
  const timeline = generateDashaTimeline(kundli);
  return timeline.find((e) => ageYears + 1e-6 >= e.startAge && ageYears < e.endAge - 1e-6);
};

export const findBhuktiAtAge = (
  kundli: KundliOutput,
  ageYears: number
): { maha: DashaEntry; bhukti: PlanetName; bhuktiStartAge: number; bhuktiEndAge: number } | undefined => {
  const maha = findMahadashaAtAge(kundli, ageYears);
  if (!maha) return undefined;
  const offset = Math.max(0, ageYears - maha.startAge);
  const spans = generateBhuktisInMahadasha(maha.planet);
  let t = 0;
  for (const s of spans) {
    const next = t + s.years;
    if (offset < next - 1e-9) {
      return {
        maha,
        bhukti: s.planet,
        bhuktiStartAge: maha.startAge + t,
        bhuktiEndAge: Math.min(maha.endAge, maha.startAge + next)
      };
    }
    t = next;
  }
  const last = spans[spans.length - 1]!;
  return {
    maha,
    bhukti: last.planet,
    bhuktiStartAge: Math.max(maha.startAge, maha.endAge - last.years),
    bhuktiEndAge: maha.endAge
  };
};

/** Flatten first `maxYears` of life into bhukti-level spans. */
export const generateBhuktiTimeline = (kundli: KundliOutput, maxYears = 100): BhuktiSpan[] => {
  const mahas = generateDashaTimeline(kundli, maxYears);
  const flat: BhuktiSpan[] = [];
  for (const m of mahas) {
    const subs = generateBhuktisInMahadasha(m.planet);
    let cursor = m.startAge;
    for (const s of subs) {
      const end = Math.min(m.endAge, cursor + s.years);
      if (end > cursor + 1e-9) {
        flat.push({
          maha: m.planet,
          bhukti: s.planet,
          startAge: cursor,
          endAge: end,
          durationYears: end - cursor
        });
      }
      cursor += s.years;
      if (cursor >= m.endAge - 1e-9) break;
    }
  }
  return flat.filter((b) => b.startAge < maxYears);
};
