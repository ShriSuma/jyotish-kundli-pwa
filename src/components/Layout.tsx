import { useEffect, useState, type ReactNode } from "react";
import SunCalc from "suncalc";
import { useTranslation } from "react-i18next";
import { calculatePanchang } from "../core/PanchangEngine";
import { calculateRahuKaal } from "../core/RahuKaalEngine";
import { calendarYmdForPanchangPin, panchangClockTimeZone, panchangSolarAnchorDate } from "../core/placeTime";
import { applySunTimesToPanchang, fetchSunriseSunsetUtc } from "../core/sunriseSunsetApi";
import { resolvePanchangCoords } from "../core/resolvePanchangCoords";
import { getPermissionStatus } from "../core/NotificationManager";
import { scheduleDailyPanchang, scheduleRahuKaal } from "../core/NotificationScheduler";
import { useAppStore, type AppPage } from "../stores/appStore";
import InstallPrompt from "./InstallPrompt";

type Props = {
  children: ReactNode;
};

const TabButton = ({ page, icon, label }: { page: AppPage; icon: string; label: string }) => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);
  const active = currentPage === page;
  return (
    <button
      type="button"
      className={`jk-btn flex min-w-[4.25rem] shrink-0 flex-col items-center py-2.5 text-[11px] font-medium sm:text-xs ${
        active ? "text-[color:var(--jk-accent)]" : "text-slate-600"
      }`}
      onClick={() => setPage(page)}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default function Layout({ children }: Props): JSX.Element {
  const { t } = useTranslation();
  const notifications = useAppStore((s) => s.notifications);
  const defaultLat = useAppStore((s) => s.defaultLat);
  const defaultLng = useAppStore((s) => s.defaultLng);
  const pincode = useAppStore((s) => s.pincode);
  const placeLabel = useAppStore((s) => s.placeLabel);
  const ayanamsaModel = useAppStore((s) => s.ayanamsaModel);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (getPermissionStatus() !== "granted") return;
      if (!notifications.dailyPanchang && !notifications.rahuKaal) return;
      const now = new Date();
      const { lat, lng } = await resolvePanchangCoords(defaultLat, defaultLng, pincode, placeLabel);
      const anchor = panchangSolarAnchorDate(now, lat, lng, pincode);
      const ymd = calendarYmdForPanchangPin(now, lat, lng, pincode);
      let panchang = calculatePanchang(anchor, lat, lng, {
        locale: "en-IN",
        pincode,
        ayanamsaModel
      });
      const apiTimes = await fetchSunriseSunsetUtc(lat, lng, ymd);
      const scTimes = SunCalc.getTimes(anchor, lat, lng);
      const times = apiTimes ?? { sunrise: scTimes.sunrise, sunset: scTimes.sunset };
      panchang = applySunTimesToPanchang(panchang, times, "en-IN", lat, lng, pincode);
      const rahu = calculateRahuKaal(now, times.sunrise, times.sunset, {
        locale: "en-IN",
        clockTimeZone: panchangClockTimeZone(lat, lng, pincode)
      });
      if (notifications.dailyPanchang) await scheduleDailyPanchang(panchang);
      if (notifications.rahuKaal) await scheduleRahuKaal(rahu);
    };
    void run();
  }, [notifications.dailyPanchang, notifications.rahuKaal, defaultLat, defaultLng, pincode, placeLabel, ayanamsaModel]);

  return (
    <div className="min-h-screen pb-24 text-[color:var(--jk-card-fg)]">
      {!online && (
        <div
          className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
          role="status"
        >
          {t("layout.offlineMode")}
        </div>
      )}
      <header className="border-b border-[color:var(--jk-nav-border)] bg-[color:var(--jk-nav-bg)] px-4 py-3 text-center backdrop-blur-md">
        <span className="text-lg font-semibold tracking-tight text-indigo-950">{t("app.title")}</span>
        <p className="mt-0.5 text-xs text-slate-600">{t("app.subtitle")}</p>
      </header>
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <InstallPrompt />
        {children}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto border-t border-[color:var(--jk-nav-border)] bg-[color:var(--jk-nav-bg)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(30,27,75,0.06)] backdrop-blur-md">
        <TabButton page="home" icon="⌂" label={t("nav.home")} />
        <TabButton page="kundli" icon="◈" label={t("nav.kundli")} />
        <TabButton page="predictions" icon="✦" label={t("nav.predictions")} />
        <TabButton page="insights" icon="☍" label={t("nav.insights")} />
        <TabButton page="melapak" icon="💞" label={t("nav.melapak")} />
        <TabButton page="settings" icon="⚙" label={t("nav.settings")} />
      </nav>
    </div>
  );
}
