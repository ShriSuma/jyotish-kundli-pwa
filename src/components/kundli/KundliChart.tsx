import type { KundliOutput } from "../../core/AstroTypes";
import NorthIndianChart from "./NorthIndianChart";
import SouthIndianChart from "./SouthIndianChart";

type Props = {
  kundli: KundliOutput | null;
  chartStyle: "north" | "south";
  personName?: string;
  gothra?: string;
};

export default function KundliChart({ kundli, chartStyle, personName, gothra }: Props): JSX.Element {
  if (!kundli) {
    return <div className="rounded border border-dashed p-6 text-sm text-slate-500">Generate Kundli to view chart</div>;
  }
  return chartStyle === "north" ? (
    <NorthIndianChart kundli={kundli} />
  ) : (
    <SouthIndianChart kundli={kundli} personName={personName ?? ""} gothra={gothra} />
  );
}

