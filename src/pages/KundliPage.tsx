import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { KundliInput, KundliOutput } from "../core/AstroTypes";
import { calculateKundli } from "../core/KundliEngine";
import { getDailyPrediction } from "../core/PredictionEngine";
import { generateDashaTimeline, type DashaEntry } from "../core/DashaBhuktiEngine";
import { exportSvgAsPdf, exportSvgAsPng } from "../core/ExportUtils";
import { analytics } from "../core/analytics";
import { saveKundli } from "../db/indexedDb";
import { useAppStore } from "../stores/appStore";
import { useKundliViewerStore } from "../stores/kundliViewerStore";
import KundliChart from "../components/kundli/KundliChart";
import TraditionalSouthPatrika from "../components/kundli/TraditionalSouthPatrika";
import { DashaBhuktiExplorer, LifetimeDashaBar } from "../components/kundli/DashaLifetimeChart";
import DatePicker from "../components/DatePicker";
import TimePicker from "../components/TimePicker";
import LocationSelector, { type SelectedLocation } from "../components/LocationSelector";
import MapLocationPicker from "../components/MapLocationPicker";
import Card from "../components/ui/Card";
import { buildNarrativeSummary, fetchKundliNarrative, NarrativeApiError } from "../services/kundliNarrativeApi";
import { formatPickerDateLocalYmd, formatPickerTimeLocalHm } from "../core/birthTime";
import { formatRashiAmsha } from "../core/localeNumbers";

const GOTRA_SELECT = [
  { value: "", labelKey: "kundli.gotraNone" as const },
  { value: "Vasishtha", labelKey: "kundli.gotraVasishtha" as const },
  { value: "Angirasa", labelKey: "kundli.gotraAngirasa" as const },
  { value: "Vishvamitra", labelKey: "kundli.gotraVishvamitra" as const }
];

const parseYmdToDate = (ymd: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
};

const parseHmToTimeDate = (hm: string): Date | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  return new Date(1970, 0, 1, Number(m[1]), Number(m[2]), 0, 0);
};

export default function KundliPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const chartStyle = useAppStore((s) => s.chartStyle);
  const setChartStyle = useAppStore((s) => s.setChartStyle);
  const defaultLat = useAppStore((s) => s.defaultLat);
  const defaultLng = useAppStore((s) => s.defaultLng);
  const placeLabelStore = useAppStore((s) => s.placeLabel);
  const pincodeStore = useAppStore((s) => s.pincode);
  const setDefaultLocation = useAppStore((s) => s.setDefaultLocation);
  const narrativeConsent = useAppStore((s) => s.narrativeConsent);
  const setPage = useAppStore((s) => s.setPage);
  const setKundliSession = useKundliViewerStore((s) => s.setSession);
  const clearKundliSession = useKundliViewerStore((s) => s.clearSession);
  const kundliSession = useKundliViewerStore((s) => s.session);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<KundliInput>({
    name: "",
    birthDate: "",
    birthTime: "",
    latitude: defaultLat,
    longitude: defaultLng,
    gothra: "",
    pincode: pincodeStore || undefined
  });
  const [result, setResult] = useState<KundliOutput | null>(null);
  const [dailyPrediction, setDailyPrediction] = useState<string>("");
  const [dasha, setDasha] = useState<DashaEntry[]>([]);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [birthDatePicker, setBirthDatePicker] = useState<Date | null>(null);
  const [birthTimePicker, setBirthTimePicker] = useState<Date | null>(null);
  const [locationCore, setLocationCore] = useState<string>(placeLabelStore);
  const [homePlaceName, setHomePlaceName] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState("");

  const placeDisplay = useMemo(
    () => (homePlaceName.trim() ? `${homePlaceName.trim()} · ${locationCore}` : locationCore),
    [homePlaceName, locationCore]
  );

  const pushPlaceToStore = (lat: number, lng: number, core: string, pin?: string) => {
    const label = homePlaceName.trim() ? `${homePlaceName.trim()} · ${core}` : core;
    void setDefaultLocation(lat, lng, label, pin && /^\d{6}$/.test(pin) ? pin : "");
  };

  /** Restore chart from in-memory session when returning to this tab. */
  useEffect(() => {
    if (!kundliSession) return;
    setForm(kundliSession.input);
    setResult(kundliSession.result);
    const bd = parseYmdToDate(kundliSession.birthDateYmd);
    const bt = parseHmToTimeDate(kundliSession.birthTimeHm);
    if (bd) setBirthDatePicker(bd);
    if (bt) setBirthTimePicker(bt);
    setHomePlaceName(kundliSession.homePlaceName);
    setLocationCore(kundliSession.placeLabel);
    setDasha(kundliSession.dasha);
    setDailyPrediction(kundliSession.dailyPrediction);
  }, [kundliSession]);

  /** Sync default place from settings when no active chart session. */
  useEffect(() => {
    if (kundliSession) return;
    setForm((f) => ({
      ...f,
      latitude: defaultLat,
      longitude: defaultLng
    }));
    setLocationCore(placeLabelStore);
  }, [kundliSession, defaultLat, defaultLng, placeLabelStore]);

  const onGenerate = async () => {
    if (!form.name || !birthDatePicker || !birthTimePicker) {
      setError(t("kundli.requiredFields"));
      return;
    }
    if (!form.pincode || !/^[1-9]\d{5}$/.test(form.pincode.trim())) {
      setError(t("kundli.pincodeRequired"));
      return;
    }

    const birthDate = formatPickerDateLocalYmd(birthDatePicker);
    const birthTime = formatPickerTimeLocalHm(birthTimePicker);
    const payload: KundliInput = {
      ...form,
      birthDate,
      birthTime,
      pincode: form.pincode && /^\d{6}$/.test(form.pincode) ? form.pincode : undefined
    };

    setError("");
    const output = calculateKundli(payload);
    setResult(output);
    const birthCtx = {
      birthDate,
      birthTime,
      latitude: form.latitude,
      longitude: form.longitude
    };
    const dp = getDailyPrediction(output, new Date(), t, form.name, birthCtx);
    const dashaTimeline = generateDashaTimeline(output);
    const predText = [dp.summary, dp.dashaLine, dp.timingLine].filter(Boolean).join("\n\n");
    setDailyPrediction(predText);
    setDasha(dashaTimeline);
    setKundliSession({
      result: output,
      input: payload,
      birthDateYmd: birthDate,
      birthTimeHm: birthTime,
      homePlaceName,
      placeLabel: homePlaceName.trim() ? `${homePlaceName.trim()} · ${locationCore}` : locationCore,
      dasha: dashaTimeline,
      dailyPrediction: predText
    });
    const id = await saveKundli(payload, output);
    setSavedId(id);
    setNarrative("");
    setNarrativeError("");
    await analytics.track("kundli_generated");
  };

  const summaryText = useMemo(() => {
    if (!result) return "";
    return t("kundli.shareSummary", {
      name: form.name,
      asc: result.ascendant.toFixed(2),
      moon: t(`rashis.${result.moonSign.sanskrit}` as "rashis.Mesha")
    });
  }, [form.name, result, t]);

  const gotraDisplay = useMemo(() => {
    const v = (form.gothra ?? "").trim();
    if (!v) return "";
    const row = GOTRA_SELECT.find((o) => o.value === v);
    return row ? t(row.labelKey) : v;
  }, [form.gothra, t]);

  const narrativeUrlConfigured = Boolean(import.meta.env.VITE_NARRATIVE_API_URL);

  const onDetailsAboutMe = async () => {
    if (!result || !birthDatePicker || !birthTimePicker) return;
    if (!narrativeConsent || !narrativeUrlConfigured) {
      setNarrativeError(t("kundli.detailsConsentHint"));
      return;
    }
    setNarrativeLoading(true);
    setNarrativeError("");
    try {
      const birthDate = formatPickerDateLocalYmd(birthDatePicker);
      const birthTime = formatPickerTimeLocalHm(birthTimePicker);
      const body = buildNarrativeSummary({ name: form.name, birthDate, birthTime }, result, i18n.language);
      const text = await fetchKundliNarrative(body);
      setNarrative(text);
    } catch (e) {
      const msg = e instanceof NarrativeApiError ? e.message : (e as Error).message;
      setNarrativeError(msg || t("kundli.detailsError"));
    } finally {
      setNarrativeLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-indigo-950">{t("kundli.formTitle")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("kundli.subtitle")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          placeholder={t("kundli.name")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          aria-label={t("kundli.gothra")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm"
          value={form.gothra ?? ""}
          onChange={(e) => setForm({ ...form, gothra: e.target.value })}
        >
          {GOTRA_SELECT.map((opt) => (
            <option key={opt.value || "none"} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
        <DatePicker selected={birthDatePicker} onChange={setBirthDatePicker} placeholderText={t("kundli.birthDate")} />
        <TimePicker selected={birthTimePicker} onChange={setBirthTimePicker} />
        <input
          required
          aria-required
          placeholder={t("kundli.pincodePlaceholder")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm"
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          value={form.pincode ?? ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setForm({ ...form, pincode: v.length ? v : undefined });
          }}
        />
        <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800">
          {placeDisplay}
        </div>
        <input
          placeholder={t("kundli.homePlaceName")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm md:col-span-2"
          value={homePlaceName}
          onChange={(e) => setHomePlaceName(e.target.value)}
          onBlur={() => pushPlaceToStore(form.latitude, form.longitude, locationCore, form.pincode)}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{t("kundli.pincodeHint")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={() => setMapOpen(true)}
        >
          {t("kundli.openMap")}
        </button>
      </div>
      <div className="mt-3">
        <LocationSelector
          filterPincode={form.pincode && /^\d{6}$/.test(form.pincode) ? form.pincode : undefined}
          onChange={(location: SelectedLocation) => {
            setForm({ ...form, latitude: location.lat, longitude: location.lng, pincode: location.pincode });
            const core = `${location.villageName} (${location.pincode})`;
            setLocationCore(core);
            pushPlaceToStore(location.lat, location.lng, core, location.pincode);
          }}
        />
      </div>
      <MapLocationPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        defaultLat={form.latitude}
        defaultLng={form.longitude}
        onConfirm={(lat, lng, label) => {
          setForm({ ...form, latitude: lat, longitude: lng });
          setLocationCore(label);
          pushPlaceToStore(lat, lng, label, form.pincode && /^\d{6}$/.test(form.pincode) ? form.pincode : undefined);
        }}
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="jk-btn rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          onClick={() => void onGenerate()}
        >
          {t("kundli.generate")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={async () => {
            if (!result || !birthDatePicker || !birthTimePicker) return;
            if (!form.pincode || !/^[1-9]\d{5}$/.test(form.pincode.trim())) {
              setError(t("kundli.pincodeRequired"));
              return;
            }
            const birthDate = formatPickerDateLocalYmd(birthDatePicker);
            const birthTime = formatPickerTimeLocalHm(birthTimePicker);
            const payload: KundliInput = {
              ...form,
              birthDate,
              birthTime,
              pincode: form.pincode && /^\d{6}$/.test(form.pincode) ? form.pincode : undefined
            };
            const id = await saveKundli(payload, result);
            setSavedId(id);
          }}
        >
          {t("kundli.save")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={async () => {
            const svg = svgHostRef.current?.querySelector("svg");
            if (svg) await exportSvgAsPng(svg as SVGSVGElement, `kundli-${form.name || "chart"}`);
          }}
        >
          {t("kundli.download")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={async () => {
            const svg = svgHostRef.current?.querySelector("svg");
            if (svg) await exportSvgAsPdf(svg as SVGSVGElement, `kundli-${form.name || "chart"}`);
          }}
        >
          {t("kundli.downloadPdf")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={async () => {
            if ((navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
              await navigator.share?.({ text: summaryText, title: t("app.title") });
            } else {
              await navigator.clipboard.writeText(summaryText);
            }
          }}
        >
          {t("kundli.share")}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="font-medium text-indigo-900">{t("settings.chartStyle")}:</span>
        <button
          type="button"
          className={`jk-btn rounded-lg border px-3 py-1 ${chartStyle === "north" ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]" : "border-slate-200 bg-white"}`}
          onClick={() => void setChartStyle("north")}
        >
          {t("settings.chartNorth")}
        </button>
        <button
          type="button"
          className={`jk-btn rounded-lg border px-3 py-1 ${chartStyle === "south" ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]" : "border-slate-200 bg-white"}`}
          onClick={() => void setChartStyle("south")}
        >
          {t("settings.chartSouth")}
        </button>
      </div>
      {savedId && (
        <p className="mt-2 text-xs text-emerald-800">
          {t("kundli.savedPrefix")} ({savedId})
        </p>
      )}
      {result && (
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            className="jk-btn rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
            onClick={() => {
              clearKundliSession();
              setResult(null);
              setDailyPrediction("");
              setDasha([]);
              setNarrative("");
              setNarrativeError("");
            }}
          >
            {t("kundli.closeChart")}
          </button>
          <button
            type="button"
            className="jk-btn text-sm font-medium text-[color:var(--jk-accent)] underline-offset-2 hover:underline"
            onClick={() => setPage("predictions")}
          >
            {t("kundli.viewPredictions")}
          </button>
          <button
            type="button"
            className="jk-btn text-sm font-medium text-[color:var(--jk-accent)] underline-offset-2 hover:underline"
            onClick={() => setPage("insights")}
          >
            {t("kundli.viewInsights")}
          </button>
        </div>
      )}
      <div ref={svgHostRef} className="mt-4">
        <KundliChart
          kundli={result}
          chartStyle={chartStyle}
          personName={form.name}
          gothra={gotraDisplay}
        />
      </div>
      {result && chartStyle === "south" && birthDatePicker && birthTimePicker ? (
        <TraditionalSouthPatrika
          kundli={result}
          personName={form.name}
          gothra={gotraDisplay}
          birthDate={formatPickerDateLocalYmd(birthDatePicker)}
          birthTime={formatPickerTimeLocalHm(birthTimePicker)}
          latitude={form.latitude}
          longitude={form.longitude}
          placeLabel={placeDisplay}
          pincode={form.pincode}
        />
      ) : null}
      {result && (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={narrativeLoading}
            className="jk-btn rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-950 disabled:opacity-50"
            onClick={() => void onDetailsAboutMe()}
          >
            {t("kundli.detailsAboutMe")}
          </button>
          {narrativeLoading && <p className="text-sm text-slate-600">{t("kundli.detailsLoading")}</p>}
          {narrativeError && <p className="text-sm text-red-700">{narrativeError}</p>}
          {narrative && <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800">{narrative}</p>}
        </div>
      )}
      {result?.nameSyllableHint ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs text-slate-800">
          <p className="font-semibold text-indigo-950">{t("kundli.syllableHintTitle")}</p>
          <p className="mt-1">{t("kundli.syllableHintBody")}</p>
          <p className="mt-2 font-medium">{result.nameSyllableHint}</p>
        </div>
      ) : null}
      {dailyPrediction && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-slate-800">
          <p className="font-semibold text-indigo-950">{t("kundli.todayPrediction")}</p>
          <p className="mt-1">{dailyPrediction}</p>
        </div>
      )}
      {dasha.length > 0 && result ? (
        <div className="mt-4 space-y-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-slate-800">
          <p className="font-semibold text-indigo-950">{t("kundli.dashaTitle")}</p>
          <LifetimeDashaBar kundli={result} maxAge={120} />
          {birthDatePicker && birthTimePicker ? (
            <DashaBhuktiExplorer kundli={result} maxAge={120} />
          ) : null}
          <div className="grid gap-1 md:grid-cols-2">
            {dasha.map((entry) => (
              <p key={`${entry.planet}-${entry.startAge}`}>
                {t(`planets.${entry.planet}` as "planets.Sun")}: {entry.startAge.toFixed(2)} – {entry.endAge.toFixed(2)}{" "}
                {t("kundli.dashaYearsUnit")}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {result && (
        <table className="mt-4 w-full text-left text-xs text-slate-800">
          <thead className="text-indigo-950">
            <tr>
              <th className="py-1 pr-2">{t("kundli.planetTable.planet")}</th>
              <th className="py-1 pr-2">{t("kundli.planetTable.degree")}</th>
              <th className="py-1 pr-2">{t("kundli.planetTable.amsha")}</th>
              <th className="py-1 pr-2">{t("kundli.planetTable.rashi")}</th>
              <th className="py-1 pr-2">{t("kundli.planetTable.nakshatra")}</th>
              <th className="py-1">{t("kundli.planetTable.house")}</th>
            </tr>
          </thead>
          <tbody>
            {result.planets.map((planet) => (
              <tr key={planet.name}>
                <td>{t(`planets.${planet.name}` as "planets.Sun")}</td>
                <td>{planet.degree.toFixed(2)}</td>
                <td>{formatRashiAmsha(planet.degree, i18n.language)}</td>
                <td>{t(`rashis.${planet.rashi.sanskrit}` as "rashis.Mesha")}</td>
                <td>{t(`nakshatras.${planet.nakshatra.sanskrit.replace(/\s+/g, "")}` as "nakshatras.Ashwini")}</td>
                <td>{planet.house}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
