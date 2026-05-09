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
import KundliChart from "../components/kundli/KundliChart";
import DatePicker from "../components/DatePicker";
import TimePicker from "../components/TimePicker";
import LocationSelector, { type SelectedLocation } from "../components/LocationSelector";
import MapLocationPicker from "../components/MapLocationPicker";
import Card from "../components/ui/Card";
import { buildNarrativeSummary, fetchKundliNarrative, NarrativeApiError } from "../services/kundliNarrativeApi";

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

  useEffect(() => {
    setForm((f) => ({
      ...f,
      latitude: defaultLat,
      longitude: defaultLng,
      pincode: pincodeStore || f.pincode
    }));
    setLocationCore(pincodeStore ? `${placeLabelStore} (${pincodeStore})` : placeLabelStore);
  }, [defaultLat, defaultLng, placeLabelStore, pincodeStore]);

  const onGenerate = async () => {
    if (!form.name || !birthDatePicker || !birthTimePicker) {
      setError(t("kundli.requiredFields"));
      return;
    }

    const birthDate = birthDatePicker.toISOString().slice(0, 10);
    const birthTime = birthTimePicker.toTimeString().slice(0, 5);
    const payload: KundliInput = {
      ...form,
      birthDate,
      birthTime,
      pincode: form.pincode && /^\d{6}$/.test(form.pincode) ? form.pincode : undefined
    };

    setError("");
    const output = calculateKundli(payload);
    setResult(output);
    setDailyPrediction(getDailyPrediction(output, new Date(), t, form.name).summary);
    setDasha(generateDashaTimeline(output).slice(0, 8));
    const id = await saveKundli(payload, output);
    setSavedId(id);
    setNarrative("");
    setNarrativeError("");
    await analytics.track("kundli_generated");
  };

  const summaryText = useMemo(() => {
    if (!result) return "";
    return `Kundli for ${form.name}\nAscendant: ${result.ascendant.toFixed(2)}\nMoon: ${result.moonSign.english}\nGenerated using Jyotish Kundli`;
  }, [form.name, result]);

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
      const birthDate = birthDatePicker.toISOString().slice(0, 10);
      const birthTime = birthTimePicker.toTimeString().slice(0, 5);
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
        <input
          placeholder={t("kundli.gothra")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm"
          value={form.gothra ?? ""}
          onChange={(e) => setForm({ ...form, gothra: e.target.value })}
        />
        <DatePicker selected={birthDatePicker} onChange={setBirthDatePicker} placeholderText={t("kundli.birthDate")} />
        <TimePicker selected={birthTimePicker} onChange={setBirthTimePicker} />
        <input
          placeholder={t("kundli.pincodeOptional")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-indigo-950 shadow-sm"
          inputMode="numeric"
          maxLength={6}
          value={form.pincode ?? ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setForm({ ...form, pincode: v || undefined });
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
            const birthDate = birthDatePicker.toISOString().slice(0, 10);
            const birthTime = birthTimePicker.toTimeString().slice(0, 5);
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
        <button
          type="button"
          className="jk-btn mt-2 text-sm font-medium text-[color:var(--jk-accent)] underline-offset-2 hover:underline"
          onClick={() => setPage("predictions")}
        >
          {t("kundli.viewPredictions")}
        </button>
      )}
      <div ref={svgHostRef} className="mt-4">
        <KundliChart
          kundli={result}
          chartStyle={chartStyle}
          personName={form.name}
          gothra={form.gothra}
        />
      </div>
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
      {dasha.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-slate-800">
          <p className="mb-2 font-semibold text-indigo-950">{t("kundli.dashaTitle")}</p>
          <div className="grid gap-1 md:grid-cols-2">
            {dasha.map((entry) => (
              <p key={`${entry.planet}-${entry.startAge}`}>
                {entry.planet}: {entry.startAge}y - {entry.endAge}y
              </p>
            ))}
          </div>
        </div>
      )}
      {result && (
        <table className="mt-4 w-full text-left text-xs text-slate-800">
          <thead className="text-indigo-950">
            <tr>
              <th className="py-1 pr-2">{t("kundli.planetTable.planet")}</th>
              <th className="py-1 pr-2">{t("kundli.planetTable.degree")}</th>
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
