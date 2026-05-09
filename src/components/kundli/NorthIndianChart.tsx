import type { KundliOutput } from "../../core/AstroTypes";
import { getPlanetShortName } from "./ChartUtils";

type Props = { kundli: KundliOutput };

export default function NorthIndianChart({ kundli }: Props): JSX.Element {
  return (
    <svg data-testid="north-chart" viewBox="0 0 300 300" className="h-72 w-72 rounded border bg-white">
      <polygon points="150,10 290,150 150,290 10,150" fill="none" stroke="#111827" strokeWidth="2" />
      <line x1="150" y1="10" x2="150" y2="290" stroke="#9ca3af" />
      <line x1="10" y1="150" x2="290" y2="150" stroke="#9ca3af" />
      <line x1="80" y1="80" x2="220" y2="220" stroke="#d1d5db" />
      <line x1="220" y1="80" x2="80" y2="220" stroke="#d1d5db" />
      {kundli.planets.map((planet, idx) => (
        <text key={planet.name} x={24 + (idx % 3) * 85} y={35 + Math.floor(idx / 3) * 75} fontSize="12">
          {getPlanetShortName(planet.name)} H{planet.house}
        </text>
      ))}
    </svg>
  );
}

