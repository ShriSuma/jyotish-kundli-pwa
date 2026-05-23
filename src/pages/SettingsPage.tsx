import { useTranslation } from "react-i18next";
import SunCalc from "suncalc";
import { APP_VERSION, BUILD_DATE } from "../core/version";
import {
  getPermissionStatus,
  requestPermission,
  sendTestNotification
} from "../core/NotificationManager";
import {
  cancelAllNotifications,
  scheduleDailyPanchang,
  scheduleRahuKaal
} from "../core/NotificationScheduler";
import { calculatePanchang } from "../core/PanchangEngine";
import { calculateRahuKaal } from "../core/RahuKaalEngine";
import { calendarYmdForPanchangPin, panchangClockTimeZone, panchangSolarAnchorDate } from "../core/placeTime";
import { applySunTimesToPanchang, fetchSunriseSunsetUtc } from "../core/sunriseSunsetApi";
import { resolvePanchangCoords } from "../core/resolvePanchangCoords";
import { useAppStore, type SupportedLanguage } from "../stores/appStore";
import Card from "../components/ui/Card";

const LANGS: SupportedLanguage[] = ["en", "hi", "kn", "te", "ta"];

export default function SettingsPage(): JSX.Element {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const chartStyle = useAppStore((s) => s.chartStyle);
  const setChartStyle = useAppStore((s) => s.setChartStyle);
  const notifications = useAppStore((s) => s.notifications);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const defaultLat = useAppStore((s) => s.defaultLat);
  const defaultLng = useAppStore((s) => s.defaultLng);
  const placeLabel = useAppStore((s) => s.placeLabel);
  const pincode = useAppStore((s) => s.pincode);
  const narrativeConsent = useAppStore((s) => s.narrativeConsent);
  const setNarrativeConsent = useAppStore((s) => s.setNarrativeConsent);
  const ayanamsaModel = useAppStore((s) => s.ayanamsaModel);
  const setAyanamsaModel = useAppStore((s) => s.setAyanamsaModel);
  const nodeType = useAppStore((s) => s.nodeType);
  const setNodeType = useAppStore((s) => s.setNodeType);
  const permission = getPermissionStatus();

  const permissionLabel =
    permission === "granted"
      ? t("settings.permissionGranted")
      : permission === "denied"
        ? t("settings.permissionDenied")
        : t("settings.permissionDefault");

  const toggleNotification = async (type: "dailyPanchang" | "rahuKaal", value: boolean) => {
    const next = { ...notifications, [type]: value };
    await setNotifications(next);
    if (!value) {
      await cancelAllNotifications(type);
      return;
    }
    const now = new Date();
    const { lat, lng } = await resolvePanchangCoords(defaultLat, defaultLng, pincode, placeLabel);
    const anchor = panchangSolarAnchorDate(now, lat, lng, pincode);
    const ymd = calendarYmdForPanchangPin(now, lat, lng, pincode);
    let p = calculatePanchang(anchor, lat, lng, {
      locale: "en-IN",
      pincode,
      ayanamsaModel
    });
    const apiTimes = await fetchSunriseSunsetUtc(lat, lng, ymd);
    const scTimes = SunCalc.getTimes(anchor, lat, lng);
    const times = apiTimes ?? { sunrise: scTimes.sunrise, sunset: scTimes.sunset };
    p = applySunTimesToPanchang(p, times, "en-IN", lat, lng, pincode);
    const rahu = calculateRahuKaal(new Date(), times.sunrise, times.sunset, {
      locale: "en-IN",
      clockTimeZone: panchangClockTimeZone(lat, lng, pincode)
    });
    if (type === "dailyPanchang") await scheduleDailyPanchang(p);
    if (type === "rahuKaal") await scheduleRahuKaal(rahu);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-indigo-950">{t("nav.settings")}</h2>

      <div className="mt-4">
        <p className="text-sm font-medium text-indigo-950">{t("settings.language")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGS.map((lng) => (
            <button
              key={lng}
              type="button"
              className={`jk-btn rounded-full border px-3 py-1.5 text-sm ${
                language === lng
                  ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)] text-indigo-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => void setLanguage(lng)}
            >
              {t(`settings.langName_${lng}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-indigo-950">{t("settings.chartStyle")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              chartStyle === "north"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setChartStyle("north")}
          >
            {t("settings.chartNorth")}
          </button>
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              chartStyle === "south"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setChartStyle("south")}
          >
            {t("settings.chartSouth")}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-indigo-950">{t("settings.ayanamsaTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{t("settings.ayanamsaHint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              ayanamsaModel === "drik_ganita"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setAyanamsaModel("drik_ganita")}
          >
            {t("settings.ayanamsaDrik")}
          </button>
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              ayanamsaModel === "lahiri"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setAyanamsaModel("lahiri")}
          >
            {t("settings.ayanamsaLahiri")}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-indigo-950">{t("settings.nodeTypeTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{t("settings.nodeTypeHint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              nodeType === "mean"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setNodeType("mean")}
          >
            {t("settings.nodeTypeMean")}
          </button>
          <button
            type="button"
            className={`jk-btn rounded-xl border px-4 py-2 text-sm ${
              nodeType === "true"
                ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => void setNodeType("true")}
          >
            {t("settings.nodeTypeTrue")}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-sm text-slate-700">
        <p className="font-medium text-indigo-950">{t("settings.narrativeTitle")}</p>
        <p className="text-xs leading-relaxed text-slate-600">{t("settings.narrativeHelp")}</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
            checked={narrativeConsent}
            onChange={(e) => {
              void setNarrativeConsent(e.target.checked);
            }}
          />
          <span className="font-medium text-indigo-950">{t("settings.narrativeAllow")}</span>
        </label>
      </div>

      <div className="mt-6 space-y-3 text-sm text-slate-700">
        <p className="font-medium text-indigo-950">{t("settings.notifications")}</p>
        <p className="text-xs leading-relaxed text-slate-600">{t("settings.notificationsHint")}</p>
        <p className="text-xs text-slate-600">
          <span className="font-medium text-indigo-900">{t("settings.savedPlace")}:</span>{" "}
          {placeLabel}
          {pincode ? ` · ${pincode}` : ""}
        </p>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
            checked={notifications.dailyPanchang}
            disabled={permission === "denied"}
            onChange={(e) => {
              void toggleNotification("dailyPanchang", e.target.checked);
            }}
          />
          <span>
            <span className="font-medium text-indigo-950">{t("settings.notifyPanchang")}</span>
            <span className="mt-1 block text-xs text-slate-600">{t("settings.notifyPanchangHelp")}</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
            checked={notifications.rahuKaal}
            disabled={permission === "denied"}
            onChange={(e) => {
              void toggleNotification("rahuKaal", e.target.checked);
            }}
          />
          <span>
            <span className="font-medium text-indigo-950">{t("settings.notifyRahu")}</span>
            <span className="mt-1 block text-xs text-slate-600">{t("settings.notifyRahuHelp")}</span>
          </span>
        </label>

        <button
          type="button"
          className="jk-btn w-full rounded-xl bg-[color:var(--jk-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          disabled={permission === "denied"}
          onClick={async () => {
            await requestPermission();
            sendTestNotification();
          }}
        >
          {t("settings.enableNotifications")}
        </button>
        <p className="text-xs text-slate-600">
          <span className="font-medium text-indigo-900">{t("settings.permissionLabel")}:</span> {permissionLabel}
        </p>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-600">
        <p>
          <span className="font-medium text-indigo-900">{t("settings.version")}:</span> {APP_VERSION}
        </p>
        <p>
          <span className="font-medium text-indigo-900">{t("settings.build")}:</span> {BUILD_DATE}
        </p>
        <p className="mt-1">{t("settings.about")}</p>
        <a className="mt-2 inline-block font-medium text-[color:var(--jk-accent)] underline-offset-2 hover:underline" href="#">
          {t("settings.privacyPolicy")}
        </a>
      </div>
    </Card>
  );
}
