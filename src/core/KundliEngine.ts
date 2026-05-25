import {
  PlanetName,
  type AyanamsaModel,
  type NodeType,
  type KundliInput,
  type KundliOutput,
  type PlanetPosition
} from "./AstroTypes";
import {
  ascendantTropicalDegrees,
  meanObliquityDegrees,
  siderealLongitudes
} from "./EphemerisEngine";
import {
  calculateLocalSiderealTime,
  dateToJulianUt,
  degreeToNakshatra,
  degreeToNakshatraPada,
  degreeToRashi,
  normalizeDegree
} from "./AstroMath";
import { computeMaandi } from "./MaandiEngine";
import type { PlaceSunTimes } from "./birthSunTimes";
import { resolveBirthSunTimes, sunTimesSyncForBirth } from "./birthSunTimes";
import { getNakshatraPadaHint } from "../data/nakshatraPadaHints";
import { wallClockBirthToUtc } from "./birthTime";
import { formatClockAtPlace } from "./placeTime";

const planetList = [
  PlanetName.Sun,
  PlanetName.Moon,
  PlanetName.Mars,
  PlanetName.Mercury,
  PlanetName.Jupiter,
  PlanetName.Venus,
  PlanetName.Saturn,
  PlanetName.Rahu,
  PlanetName.Ketu
] as const;

const siderealDegreeFor = (
  longs: ReturnType<typeof siderealLongitudes>,
  planet: PlanetName
): number => {
  switch (planet) {
    case PlanetName.Sun:
      return longs.sun;
    case PlanetName.Moon:
      return longs.moon;
    case PlanetName.Mars:
      return longs.mars;
    case PlanetName.Mercury:
      return longs.mercury;
    case PlanetName.Jupiter:
      return longs.jupiter;
    case PlanetName.Venus:
      return longs.venus;
    case PlanetName.Saturn:
      return longs.saturn;
    case PlanetName.Rahu:
      return longs.rahu;
    case PlanetName.Ketu:
      return longs.ketu;
    default:
      return 0;
  }
};

/**
 * Bhāva (1–12) using **whole-sign** houses (Karnataka / South Indian patrikā style):
 * House 1 = entire Lagna rāśi, House 2 = entire next rāśi, etc. Degree within the
 * sign does not move the planet to another house.
 *
 * (The earlier implementation used equal-house from ascendant degree which could
 * push a planet sitting in the same sign as Lagna but just before the asc. cusp
 * into house 12 — incorrect for whole-sign patrikā charts.)
 */
export const bhavaFromAscendant = (ascendant: number, degree: number): number => {
  const lagnaSign = Math.floor(normalizeDegree(ascendant) / 30);
  const planetSign = Math.floor(normalizeDegree(degree) / 30);
  return ((planetSign - lagnaSign + 12) % 12) + 1;
};

export type CalculateKundliOptions = {
  ayanamsaModel?: AyanamsaModel;
  nodeType?: NodeType;
  /** When omitted, sync SunCalc times for the birth civil day are used (async API path should pass resolved times). */
  sunTimes?: PlaceSunTimes;
};

export const calculateKundli = (input: KundliInput, options?: CalculateKundliOptions): KundliOutput => {
  const birthUtc = wallClockBirthToUtc(input.birthDate, input.birthTime, input.latitude, input.longitude);
  const pin = input.pincode ?? "";
  const sunTimes =
    options?.sunTimes ?? sunTimesSyncForBirth(birthUtc, input.latitude, input.longitude, pin);
  const clockLoc = "en-IN";
  const jd = dateToJulianUt(birthUtc);
  const ayanamsaModel = options?.ayanamsaModel ?? "lahiri";
  const nodeType = options?.nodeType ?? "mean";
  const longs = siderealLongitudes(birthUtc, ayanamsaModel, nodeType);
  const lst = calculateLocalSiderealTime(birthUtc, input.longitude);
  const eps = meanObliquityDegrees(jd);
  const ascTropical = ascendantTropicalDegrees(lst, input.latitude, eps);
  const ascendant = normalizeDegree(ascTropical - longs.ayanamsa);
  const houses = Array.from({ length: 12 }, (_, i) => normalizeDegree(ascendant + i * 30));

  const planets: PlanetPosition[] = planetList.map((planet) => {
    const degree = siderealDegreeFor(longs, planet);
    return {
      name: planet,
      degree,
      rashi: degreeToRashi(degree),
      nakshatra: degreeToNakshatra(degree),
      house: bhavaFromAscendant(ascendant, degree)
    };
  });

  const moon = planets.find((p) => p.name === PlanetName.Moon);
  const sun = planets.find((p) => p.name === PlanetName.Sun);
  const moonDeg = moon?.degree ?? ascendant;
  const moonPada = degreeToNakshatraPada(moonDeg);
  const lagnaRashi = degreeToRashi(ascendant);
  const moonNak = moon?.nakshatra ?? degreeToNakshatra(moonDeg);
  const syllable = getNakshatraPadaHint(moonNak.english, moonPada);

  let maandi;
  try {
    const m = computeMaandi(birthUtc, input.latitude, input.longitude, pin, ayanamsaModel, sunTimes);
    maandi = { degree: m.degree, rashi: m.rashi, windowLabel: m.windowLabel };
  } catch {
    maandi = undefined;
  }

  return {
    ascendant,
    planets,
    houses,
    moonSign: moon?.rashi ?? degreeToRashi(ascendant),
    sunSign: sun?.rashi ?? degreeToRashi(ascendant),
    lagnaRashi,
    moonPada,
    nameSyllableHint: syllable,
    maandi,
    birthSunTimes: {
      sunrise: formatClockAtPlace(sunTimes.sunrise, clockLoc, input.latitude, input.longitude, pin),
      sunset: formatClockAtPlace(sunTimes.sunset, clockLoc, input.latitude, input.longitude, pin),
      source: sunTimes.source,
      sunriseUtc: sunTimes.sunrise.toISOString(),
      sunsetUtc: sunTimes.sunset.toISOString()
    }
  };
};

/** Resolve API/sunrise times then build the chart (preferred for Kundli page). */
export const calculateKundliWithPlaceSun = async (
  input: KundliInput,
  options?: Omit<CalculateKundliOptions, "sunTimes">
): Promise<KundliOutput> => {
  const birthUtc = wallClockBirthToUtc(input.birthDate, input.birthTime, input.latitude, input.longitude);
  const sunTimes = await resolveBirthSunTimes(birthUtc, input.latitude, input.longitude, input.pincode ?? "");
  return calculateKundli(input, { ...options, sunTimes });
};
