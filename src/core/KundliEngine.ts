import {
  PlanetName,
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
import { getNakshatraPadaHint } from "../data/nakshatraPadaHints";
import { wallClockBirthToUtc } from "./birthTime";

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

/** Bhāva (1–12) from whole-sign ascendant. */
export const bhavaFromAscendant = (ascendant: number, degree: number): number => {
  const offset = normalizeDegree(degree - ascendant);
  return Math.floor(offset / 30) + 1;
};

export const calculateKundli = (input: KundliInput): KundliOutput => {
  const birthUtc = wallClockBirthToUtc(input.birthDate, input.birthTime, input.latitude, input.longitude);
  const jd = dateToJulianUt(birthUtc);
  const longs = siderealLongitudes(birthUtc);
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
    const m = computeMaandi(birthUtc, input.latitude, input.longitude, input.pincode ?? "");
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
    maandi
  };
};
