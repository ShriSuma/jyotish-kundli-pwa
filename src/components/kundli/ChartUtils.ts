import type { PlanetName } from "../../core/AstroTypes";

export const getHouseFromDegree = (ascendantDeg: number, planetDeg: number): number => {
  const offset = ((planetDeg - ascendantDeg) % 360 + 360) % 360;
  return Math.floor(offset / 30) + 1;
};

export const getPlanetShortName = (planet: PlanetName): string => {
  const map: Record<PlanetName, string> = {
    Sun: "Su",
    Moon: "Mo",
    Mars: "Ma",
    Mercury: "Me",
    Jupiter: "Ju",
    Venus: "Ve",
    Saturn: "Sa",
    Rahu: "Ra",
    Ketu: "Ke"
  };
  return map[planet];
};

export const getPlanetColor = (planet: PlanetName): string => {
  if (planet === "Jupiter" || planet === "Venus" || planet === "Moon") return "#15803d";
  if (planet === "Saturn" || planet === "Mars" || planet === "Rahu" || planet === "Ketu") return "#b91c1c";
  return "#1d4ed8";
};

