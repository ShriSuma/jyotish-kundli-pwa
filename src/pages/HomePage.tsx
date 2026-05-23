import { useEffect, useMemo, useState } from "react";
import SunCalc from "suncalc";
import { useTranslation } from "react-i18next";
import { calculatePanchang } from "../core/PanchangEngine";
import { calculateRahuKaal } from "../core/RahuKaalEngine";
import { calendarYmdForPanchangPin, civilTimeZoneForPanchangHeader, panchangClockTimeZone, panchangSolarAnchorDate, weekdayInTimeZone } from "../core/placeTime";
import { applySunTimesToPanchang, fetchSunriseSunsetUtc } from "../core/sunriseSunsetApi";
import { resolvePanchangCoords } from "../core/resolvePanchangCoords";
import { analytics } from "../core/analytics";
import { getPanchangCache, savePanchangCache } from "../db/indexedDb";
import type { PanchangOutput, RahuKaalOutput } from "../core/AstroTypes";
import { useAppStore } from "../stores/appStore";
import MapLocationPicker from "../components/MapLocationPicker";
import Card from "../components/ui/Card";
import { displayPanchangValue } from "../i18n/panchangLabels";

export default function HomePage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const defaultLat = useAppStore((s) => s.defaultLat);
  const defaultLng = useAppStore((s) => s.defaultLng);
  const placeLabel = useAppStore((s) => s.placeLabel);
  const setDefaultLocation = useAppStore((s) => s.setDefaultLocation);
  const locationConfirmed = useAppStore((s) => s.locationConfirmed);
  const setPage = useAppStore((s) => s.setPage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panchang, setPanchang] = useState<PanchangOutput | null>(null);
  const [rahu, setRahu] = useState<RahuKaalOutput | null>(null);
  const [sunrise, setSunrise] = useState<Date | null>(null);
  const [sunset, setSunset] = useState<Date | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const pincodeStore = useAppStore((s) => s.pincode);
  const ayanamsaModel = useAppStore((s) => s.ayanamsaModel);

  const [panchangDayAnchor, setPanchangDayAnchor] = useState<Date | null>(null);
  const [displayLat, setDisplayLat] = useState(defaultLat);
  const [displayLng, setDisplayLng] = useState(defaultLng);

  const validIndianPin = (pc: string) => /^[1-9]\d{5}$/.test((pc ?? "").trim());

  const pinCivilTz = useMemo(
    () => civilTimeZoneForPanchangHeader(defaultLat, defaultLng, pincodeStore),
    [defaultLat, defaultLng, pincodeStore]
  );

  const localeTag = useMemo(() => {
    const base = i18n.resolvedLanguage ?? i18n.language ?? "en";
    if (base === "en") return "en-IN";
    if (base === "kn") return "kn-IN";
    if (base === "hi") return "hi-IN";
    if (base === "te") return "te-IN";
    if (base === "ta") return "ta-IN";
    return base;
  }, [i18n.language, i18n.resolvedLanguage]);

  const formatTimeAtPlace = (d: Date, lat: number, lng: number) => {
    const tz = panchangClockTimeZone(lat, lng, pincodeStore);
    return d.toLocaleTimeString(localeTag, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz
    });
  };

  const formatHeaderDateAtPin = (d: Date) =>
    d.toLocaleDateString(localeTag, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: pinCivilTz
    });

  const weekdayIdx = panchangDayAnchor ? weekdayInTimeZone(panchangDayAnchor, pinCivilTz) : new Date().getDay();

  const loadData = async (latIn: number, lngIn: number) => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lng } = await resolvePanchangCoords(latIn, lngIn, pincodeStore, placeLabel);
      setDisplayLat(lat);
      setDisplayLng(lng);
      const ymd = calendarYmdForPanchangPin(new Date(), lat, lng, pincodeStore);
      const anchor = panchangSolarAnchorDate(new Date(), lat, lng, pincodeStore);
      const cacheKey = `${ymd}_${lat.toFixed(2)},${lng.toFixed(2)},v6-${ayanamsaModel}`;
      const cached = await getPanchangCache(ymd, cacheKey);
      let p =
        cached ??
        calculatePanchang(anchor, lat, lng, {
          locale: localeTag,
          pincode: pincodeStore,
          ayanamsaModel
        });

      const apiTimes = await fetchSunriseSunsetUtc(lat, lng, ymd);
      const scTimes = SunCalc.getTimes(anchor, lat, lng);
      const times = apiTimes ?? { sunrise: scTimes.sunrise, sunset: scTimes.sunset };
      p = applySunTimesToPanchang(p, times, localeTag, lat, lng, pincodeStore);
      await savePanchangCache(ymd, cacheKey, p);

      const r = calculateRahuKaal(new Date(), times.sunrise, times.sunset, {
        locale: localeTag,
        clockTimeZone: panchangClockTimeZone(lat, lng, pincodeStore)
      });
      setPanchangDayAnchor(anchor);
      setPanchang(p);
      setRahu(r);
      setSunrise(times.sunrise);
      setSunset(times.sunset);
      await analytics.track("panchang_viewed");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDisplayLat(defaultLat);
    setDisplayLng(defaultLng);
  }, [defaultLat, defaultLng]);

  useEffect(() => {
    if (!locationConfirmed || !validIndianPin(pincodeStore)) {
      setLoading(false);
      return;
    }
    void loadData(defaultLat, defaultLng);
  }, [defaultLat, defaultLng, locationConfirmed, localeTag, pincodeStore, placeLabel, ayanamsaModel]);

  const useDeviceLocation = () => {
    void new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          void setDefaultLocation(lat, lng, t("home.deviceLocationLabel"), "");
          void loadData(lat, lng);
          resolve();
        },
        () => resolve(),
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const beforeSunrise = Boolean(sunrise && new Date() < sunrise);

  if (!locationConfirmed) {
    return (
      <Card>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">{t("home.todayPanchang")}</h1>
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-slate-800">
          <p className="text-lg font-semibold text-indigo-950">{t("home.locationGateTitle")}</p>
          <p className="mt-2 leading-relaxed">{t("home.locationGateBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="jk-btn rounded-xl border border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)] px-4 py-2 text-sm font-medium text-indigo-950"
              onClick={() => useDeviceLocation()}
            >
              {t("home.useDeviceLocation")}
            </button>
            <button
              type="button"
              className="jk-btn rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-indigo-950"
              onClick={() => setMapOpen(true)}
            >
              {t("home.openMapPicker")}
            </button>
            <button
              type="button"
              className="jk-btn rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setPage("kundli")}
            >
              {t("home.goToKundli")}
            </button>
          </div>
        </div>
        <MapLocationPicker
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          onConfirm={(lat, lng, label) => {
            void setDefaultLocation(lat, lng, label, "");
          }}
        />
      </Card>
    );
  }

  if (!validIndianPin(pincodeStore)) {
    return (
      <Card>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">{t("home.todayPanchang")}</h1>
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-slate-800">
          <p className="text-lg font-semibold text-indigo-950">{t("home.pincodeGateTitle")}</p>
          <p className="mt-2 leading-relaxed">{t("home.pincodeGateBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="jk-btn rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setPage("kundli")}
            >
              {t("home.goToKundli")}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">{t("home.todayPanchang")}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {panchangDayAnchor ? formatHeaderDateAtPin(panchangDayAnchor) : formatHeaderDateAtPin(new Date())}
      </p>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium text-indigo-900">{t("home.placeForCalc")}:</span> {placeLabel}
        {validIndianPin(pincodeStore) ? (
          <span className="text-slate-600">
            {" "}
            · {pincodeStore}
          </span>
        ) : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={() => void loadData(defaultLat, defaultLng)}
        >
          {t("home.refresh")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)] px-3 py-2 text-sm font-medium text-indigo-950"
          onClick={() => useDeviceLocation()}
        >
          {t("home.useDeviceLocation")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-950"
          onClick={() => setMapOpen(true)}
        >
          {t("home.openMapPicker")}
        </button>
      </div>
      <MapLocationPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        defaultLat={defaultLat}
        defaultLng={defaultLng}
        onConfirm={(lat, lng, label) => {
          void setDefaultLocation(lat, lng, label, "");
          void loadData(lat, lng);
        }}
      />

      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-relaxed text-slate-800">
        <p className="font-semibold text-indigo-950">{t("home.weekdayCardTitle")}</p>
        <p className="mt-2">{t(`weekday.${weekdayIdx}`)}</p>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-600">{t("common.loading")}</p>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {sunrise && sunset && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-800">
          <p className="font-medium text-indigo-950">{t("home.sunTimes")}</p>
          <p className="mt-1">
            {t("panchang.sunrise")}: {formatTimeAtPlace(sunrise, displayLat, displayLng)} ·{" "}
            {t("panchang.sunset")}: {formatTimeAtPlace(sunset, displayLat, displayLng)}
          </p>
          {beforeSunrise && panchang && (
            <p className="mt-2 text-xs text-slate-600">
              {t("home.morningTithiNote")} {displayPanchangValue("tithi", panchang.tithi, i18n.language, t)}.
            </p>
          )}
        </div>
      )}

      {panchang && (
        <div
          data-testid="panchang-card"
          className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-sm text-slate-800"
        >
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.tithi")}:</span>{" "}
            {displayPanchangValue("tithi", panchang.tithi, i18n.language, t)}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.nakshatra")}:</span>{" "}
            {displayPanchangValue("nakshatra", panchang.nakshatra, i18n.language, t)}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.yoga")}:</span>{" "}
            {displayPanchangValue("yoga", panchang.yoga, i18n.language, t)}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.karana")}:</span>{" "}
            {displayPanchangValue("karana", panchang.karana, i18n.language, t)}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.paksha")}:</span>{" "}
            {displayPanchangValue("paksha", panchang.paksha, i18n.language, t)}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("panchang.sunrise")}:</span> {panchang.sunrise}
          </p>
          <p className="col-span-2">
            <span className="font-medium text-indigo-900">{t("panchang.sunset")}:</span> {panchang.sunset}
          </p>
        </div>
      )}
      {rahu && (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-slate-800">
          <p>
            <span className="font-medium text-indigo-900">{t("home.rahuKaal")}:</span> {rahu.startTime} –{" "}
            {rahu.endTime}
          </p>
          <p className={rahu.isActive ? "mt-1 text-amber-900" : "mt-1 text-emerald-800"}>
            {rahu.isActive ? t("rahuKaal.active") : t("rahuKaal.inactive")}
          </p>
          <p className="mt-2 text-xs text-slate-600">{t("rahuKaal.warning")}</p>
        </div>
      )}
    </Card>
  );
}
