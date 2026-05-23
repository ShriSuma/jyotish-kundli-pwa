import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { KundliOutput } from "../../core/AstroTypes";
import { PlanetName } from "../../core/AstroTypes";
import {
  type DashaEntry,
  findBhuktiAtAge,
  generateBhuktisInMahadasha,
  generateDashaTimeline
} from "../../core/DashaBhuktiEngine";

const planetBarColor: Record<PlanetName, string> = {
  [PlanetName.Sun]: "bg-amber-500",
  [PlanetName.Moon]: "bg-slate-400",
  [PlanetName.Mars]: "bg-red-600",
  [PlanetName.Mercury]: "bg-emerald-500",
  [PlanetName.Jupiter]: "bg-orange-400",
  [PlanetName.Venus]: "bg-pink-400",
  [PlanetName.Saturn]: "bg-indigo-700",
  [PlanetName.Rahu]: "bg-violet-600",
  [PlanetName.Ketu]: "bg-teal-600"
};

type BarProps = {
  kundli: KundliOutput;
  maxAge?: number;
};

export function LifetimeDashaBar({ kundli, maxAge = 120 }: BarProps): JSX.Element {
  const { t } = useTranslation();
  const timeline = useMemo(() => generateDashaTimeline(kundli, maxAge), [kundli, maxAge]);
  const span = Math.min(maxAge, timeline.at(-1)?.endAge ?? maxAge) || maxAge;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-indigo-950">{t("kundli.dashaLifetimeTitle")}</p>
      <p className="text-[11px] text-slate-600">{t("kundli.dashaLifetimeHint")}</p>
      <div className="flex h-10 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-inner">
        {timeline.map((e) => {
          const w = Math.max(0.35, ((e.endAge - e.startAge) / span) * 100);
          return (
            <div
              key={`${e.planet}-${e.startAge}`}
              title={`${t(`planets.${e.planet}`)} ${e.startAge.toFixed(2)}–${e.endAge.toFixed(2)} ${t("kundli.dashaYearsUnit")}`}
              className={`${planetBarColor[e.planet]} flex min-w-[2px] items-center justify-center border-r border-white/30 text-[9px] font-bold text-white last:border-r-0`}
              style={{ width: `${w}%` }}
            >
              {w > 5 ? t(`planets.${e.planet}`).charAt(0) : ""}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-700">
        {(Object.keys(planetBarColor) as PlanetName[]).map((p) => (
          <span key={p} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-sm ${planetBarColor[p]}`} />
            {t(`planets.${p}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

type ExplorerProps = {
  kundli: KundliOutput;
  maxAge?: number;
};

export function DashaBhuktiExplorer({ kundli, maxAge = 120 }: ExplorerProps): JSX.Element {
  const { t } = useTranslation();
  const [age, setAge] = useState(0);
  const slice = useMemo(() => findBhuktiAtAge(kundli, age), [kundli, age]);
  const timeline = useMemo(() => generateDashaTimeline(kundli, maxAge), [kundli, maxAge]);

  const significance =
    slice ? (
      <>
        <p>{t(`dashas.mahaTheme.${slice.maha.planet}` as "dashas.mahaTheme.Ketu")}</p>
        <p className="text-xs text-slate-600">
          {t("dashas.bhuktiLayer", {
            bhukti: t(`planets.${slice.bhukti}` as "planets.Moon")
          })}
        </p>
      </>
    ) : null;

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
      <p className="text-sm font-semibold text-indigo-950">{t("kundli.dashaExplorerTitle")}</p>
      <label className="block text-xs text-slate-700">
        <span className="font-medium">{t("kundli.dashaExplorerAge")}</span>: {age.toFixed(1)} {t("kundli.dashaYearsUnit")}
        <input
          type="range"
          min={0}
          max={maxAge}
          step={0.25}
          value={age}
          className="mt-1 block w-full accent-[color:var(--jk-accent)]"
          onChange={(e) => setAge(Number(e.target.value))}
        />
      </label>
      {slice ? (
        <div className="space-y-2 text-sm text-slate-800">
          <p>
            <span className="font-semibold text-indigo-900">{t("kundli.dashaMaha")}:</span>{" "}
            {t(`planets.${slice.maha.planet}`)} ({slice.maha.startAge.toFixed(2)} – {slice.maha.endAge.toFixed(2)})
          </p>
          <p>
            <span className="font-semibold text-indigo-900">{t("kundli.dashaBhukti")}:</span>{" "}
            {t(`planets.${slice.bhukti}`)} ({slice.bhuktiStartAge.toFixed(2)} – {slice.bhuktiEndAge.toFixed(2)})
          </p>
          <div className="space-y-1 leading-relaxed text-slate-700">{significance}</div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            <span className="font-semibold text-indigo-900">{t("kundli.dashaAntarSeries")}:</span>{" "}
            {generateBhuktisInMahadasha(slice.maha.planet, slice.maha.durationYears).map((s, i) => (
              <span key={`${s.planet}-${i}`}>
                {i > 0 ? " → " : ""}
                {t(`planets.${s.planet}`)}
              </span>
            ))}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{t("dashas.explorerEmpty")}</p>
      )}
      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-indigo-900">{t("kundli.dashaTableToggle")}</summary>
        <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto rounded border border-slate-200 bg-white p-2">
          {timeline.map((e: DashaEntry) => (
            <li key={`${e.planet}-${e.startAge}`}>
              {t(`planets.${e.planet}`)}: {e.startAge.toFixed(2)} – {e.endAge.toFixed(2)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
