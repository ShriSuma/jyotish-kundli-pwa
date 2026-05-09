import {
  PlanetName,
  type KundliInput,
  type KundliOutput,
  type PlanetPosition
} from "./AstroTypes";
import {
  calculateLocalSiderealTime,
  degreeToNakshatra,
  degreeToNakshatraPada,
  degreeToRashi,
  getAyanamsa,
  normalizeDegree,
  toJulianDate
} from "./AstroMath";
import { computeMaandi } from "./MaandiEngine";
import { getNakshatraPadaHint } from "../data/nakshatraPadaHints";

const planetPeriods: Record<PlanetName, number> = {
  [PlanetName.Sun]: 365.25,
  [PlanetName.Moon]: 27.32,
  [PlanetName.Mars]: 686.98,
  [PlanetName.Mercury]: 87.97,
  [PlanetName.Jupiter]: 4332.59,
  [PlanetName.Venus]: 224.7,
  [PlanetName.Saturn]: 10759.22,
  [PlanetName.Rahu]: 6798.38,
  [PlanetName.Ketu]: 6798.38
};

const baseLongitudes: Record<PlanetName, number> = {
  [PlanetName.Sun]: 280.5,
  [PlanetName.Moon]: 218.3,
  [PlanetName.Mars]: 145.0,
  [PlanetName.Mercury]: 70.1,
  [PlanetName.Jupiter]: 240.2,
  [PlanetName.Venus]: 181.0,
  [PlanetName.Saturn]: 310.4,
  [PlanetName.Rahu]: 50.0,
  [PlanetName.Ketu]: 230.0
};

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

const getPlanetDegree = (planet: PlanetName, jd: number, ayanamsa: number): number => {
  if (planet === PlanetName.Ketu) {
    const rahu = getPlanetDegree(PlanetName.Rahu, jd, ayanamsa);
    return normalizeDegree(rahu + 180);
  }

  const days = jd - 2451545.0;
  const tropical = baseLongitudes[planet] + (days / planetPeriods[planet]) * 360;
  return normalizeDegree(tropical - ayanamsa);
};

const ascendantFromLST = (lst: number, latitude: number): number => {
  const latFactor = Math.sin((latitude * Math.PI) / 180) * 15;
  return normalizeDegree(lst + latFactor);
};

const houseFromAsc = (ascendant: number, degree: number): number => {
  const offset = normalizeDegree(degree - ascendant);
  return Math.floor(offset / 30) + 1;
};

export const calculateKundli = (input: KundliInput): KundliOutput => {
  const birthDate = new Date(input.birthDate);
  const jd = toJulianDate(birthDate, input.birthTime);
  const ayanamsa = getAyanamsa(birthDate);
  const combinedDate = new Date(`${input.birthDate}T${input.birthTime}:00.000Z`);
  const lst = calculateLocalSiderealTime(combinedDate, input.longitude);
  const ascendant = ascendantFromLST(lst, input.latitude);
  const houses = Array.from({ length: 12 }, (_, i) => normalizeDegree(ascendant + i * 30));

  const planets: PlanetPosition[] = planetList.map((planet) => {
    const degree = getPlanetDegree(planet, jd, ayanamsa);
    return {
      name: planet,
      degree,
      rashi: degreeToRashi(degree),
      nakshatra: degreeToNakshatra(degree),
      house: houseFromAsc(ascendant, degree)
    };
  });

  const moon = planets.find((p) => p.name === PlanetName.Moon);
  const sun = planets.find((p) => p.name === PlanetName.Sun);
  const moonDeg = moon?.degree ?? ascendant;
  const moonPada = degreeToNakshatraPada(moonDeg);
  const lagnaRashi = degreeToRashi(ascendant);
  const moonNak = moon?.nakshatra ?? degreeToNakshatra(moonDeg);
  const syllable = getNakshatraPadaHint(moonNak.english, moonPada);

  const birthLocal = new Date(`${input.birthDate}T${input.birthTime}:00`);
  let maandi;
  try {
    const m = computeMaandi(birthLocal, input.latitude, input.longitude);
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

