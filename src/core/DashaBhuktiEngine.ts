import { PlanetName, type KundliOutput } from "./AstroTypes";

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
];

const dashaYears: Record<PlanetName, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

export type DashaEntry = {
  planet: PlanetName;
  startAge: number;
  endAge: number;
  durationYears: number;
};

export const generateDashaTimeline = (kundli: KundliOutput): DashaEntry[] => {
  const moonIdx = kundli.planets.find((planet) => planet.name === PlanetName.Moon)?.nakshatra.index ?? 0;
  const startIdx = moonIdx % dashaOrder.length;
  const timeline: DashaEntry[] = [];
  let age = 0;

  for (let i = 0; age < 100; i += 1) {
    const planet = dashaOrder[(startIdx + i) % dashaOrder.length];
    const duration = dashaYears[planet];
    timeline.push({
      planet,
      startAge: Number(age.toFixed(1)),
      endAge: Number((age + duration).toFixed(1)),
      durationYears: duration
    });
    age += duration;
  }

  return timeline;
};

