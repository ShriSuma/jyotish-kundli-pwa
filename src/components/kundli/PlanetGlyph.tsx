import type { PlanetName } from "../../core/AstroTypes";
import { getPlanetColor } from "./ChartUtils";

const symbols: Record<PlanetName, string> = {
  Sun: "☉",
  Moon: "☽",
  Mars: "♂",
  Mercury: "☿",
  Jupiter: "♃",
  Venus: "♀",
  Saturn: "♄",
  Rahu: "☊",
  Ketu: "☋"
};

type Props = {
  planetName: PlanetName;
  size?: number;
};

export default function PlanetGlyph({ planetName, size = 14 }: Props): JSX.Element {
  return (
    <text fill={getPlanetColor(planetName)} fontSize={size} fontWeight={700}>
      {symbols[planetName]}
    </text>
  );
}

