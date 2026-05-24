import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDailyPrediction, getMonthlyPrediction, getWeeklyPrediction } from "../core/PredictionEngine";
import { ageDecimalYearsAt } from "../core/birthTime";
import { findBhuktiAtAge } from "../core/DashaBhuktiEngine";
import { fetchPredictionFromApi } from "../services/predictionApi";
import { hydrateMissingTranslations } from "../services/i18nHydrate";
import {
  localizePredictionOutput,
  predictionNeedsLocalization
} from "../services/localizeContent";
import { analytics } from "../core/analytics";
import {
  getLatestKundliRecord,
  getPredictionCache,
  savePredictionCache
} from "../db/indexedDb";
import type { PredictionOutput } from "../core/AstroTypes";
import { useAppStore } from "../stores/appStore";
import Card from "../components/ui/Card";

type Tab = "daily" | "weekly" | "monthly";

export default function PredictionsPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setPage = useAppStore((s) => s.setPage);
  const ayanamsaModel = useAppStore((s) => s.ayanamsaModel);
  const [tab, setTab] = useState<Tab>("daily");
  const [prediction, setPrediction] = useState<PredictionOutput | null>(null);
  /** null = still checking for a saved chart */
  const [empty, setEmpty] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      setPrediction(null);
      try {
        const kundli = await getLatestKundliRecord();
        if (!kundli) {
          if (!cancelled) {
            setEmpty(true);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) setEmpty(false);
        const lang = (i18n.resolvedLanguage ?? i18n.language).split("-")[0];
        if (lang !== "en") {
          await hydrateMissingTranslations(lang);
        }
        const key =
          (tab === "daily"
            ? new Date().toISOString().slice(0, 10)
            : tab === "weekly"
              ? `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}`
              : `${new Date().getFullYear()}-${new Date().getMonth() + 1}`) + `-${ayanamsaModel}`;
        const cached = kundli.id ? await getPredictionCache(kundli.id, tab, key, lang) : null;
        if (cached) {
          const localized =
            lang !== "en" && predictionNeedsLocalization(cached, lang)
              ? await localizePredictionOutput(cached, lang)
              : cached;
          if (!cancelled) {
            setPrediction(localized);
            setLoading(false);
          }
          return;
        }

        const birth = {
          birthDate: kundli.birthDate,
          birthTime: kundli.birthTime,
          latitude: kundli.latitude,
          longitude: kundli.longitude,
          ayanamsaModel
        };

        const now = new Date();
        const ageYears = ageDecimalYearsAt(kundli.birthDate, kundli.birthTime, kundli.latitude, kundli.longitude, now);
        const vb = findBhuktiAtAge(kundli.kundliData, ageYears);
        const apiUrl = import.meta.env.VITE_PREDICTION_API_URL as string | undefined;

        let generated: PredictionOutput;
        if (apiUrl?.trim()) {
          try {
            generated = await fetchPredictionFromApi({
              lang,
              period: tab,
              periodKey: key,
              name: kundli.name,
              kundliSummary: {
                lagnaSanskrit: kundli.kundliData.lagnaRashi.sanskrit,
                moonSignSanskrit: kundli.kundliData.moonSign.sanskrit,
                moonPada: kundli.kundliData.moonPada,
                dashaMaha: vb?.maha.planet,
                dashaBhukti: vb?.bhukti,
                ageYears
              }
            });
          } catch {
            generated =
              tab === "daily"
                ? getDailyPrediction(kundli.kundliData, new Date(), t, kundli.name, birth)
                : tab === "weekly"
                  ? getWeeklyPrediction(kundli.kundliData, new Date(), t, kundli.name, birth)
                  : getMonthlyPrediction(
                      kundli.kundliData,
                      new Date().getFullYear(),
                      new Date().getMonth() + 1,
                      t,
                      kundli.name,
                      birth
                    );
          }
        } else {
          generated =
            tab === "daily"
              ? getDailyPrediction(kundli.kundliData, new Date(), t, kundli.name, birth)
              : tab === "weekly"
                ? getWeeklyPrediction(kundli.kundliData, new Date(), t, kundli.name, birth)
                : getMonthlyPrediction(
                    kundli.kundliData,
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    t,
                    kundli.name,
                    birth
                  );
        }
        if (lang !== "en" && predictionNeedsLocalization(generated, lang)) {
          generated = await localizePredictionOutput(generated, lang);
        }
        if (kundli.id) {
          await savePredictionCache(kundli.id, tab, key, lang, generated);
        }
        if (!cancelled) {
          setPrediction(generated);
          await analytics.track("prediction_viewed", { tab });
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setLoadError(msg || t("predictions.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, i18n.language, i18n.resolvedLanguage, t, ayanamsaModel]);

  if (empty === null) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{t("common.loading")}</p>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card>
        <p className="font-medium text-indigo-950">{t("predictions.emptyTitle")}</p>
        <p className="mt-2 text-sm text-slate-600">{t("predictions.emptyBody")}</p>
        <button
          type="button"
          className="jk-btn mt-4 rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-medium text-white"
          onClick={() => setPage("kundli")}
        >
          {t("predictions.goToKundli")}
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`jk-btn rounded-xl border px-3 py-2 text-sm ${
            tab === "daily" ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]" : "border-slate-200 bg-white"
          }`}
          onClick={() => setTab("daily")}
        >
          {t("predictions.daily")}
        </button>
        <button
          type="button"
          className={`jk-btn rounded-xl border px-3 py-2 text-sm ${
            tab === "weekly" ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]" : "border-slate-200 bg-white"
          }`}
          onClick={() => setTab("weekly")}
        >
          {t("predictions.weekly")}
        </button>
        <button
          type="button"
          className={`jk-btn rounded-xl border px-3 py-2 text-sm ${
            tab === "monthly" ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]" : "border-slate-200 bg-white"
          }`}
          onClick={() => setTab("monthly")}
        >
          {t("predictions.monthly")}
        </button>
      </div>
      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900">
          <p>{loadError}</p>
          <p className="mt-2 text-xs text-red-800">{t("predictions.loadErrorHint")}</p>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-slate-600">{t("common.loading")}</p> : null}
      {!loading && prediction ? (
        <div className="space-y-2 text-sm text-slate-800">
          <h3 className="text-lg font-semibold text-indigo-950">{prediction.title}</h3>
          <p>{prediction.summary}</p>
          {prediction.integratedReading ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                {t("predictions.completeReadingLabel")}
              </p>
              <p className="mt-2 leading-relaxed">{prediction.integratedReading}</p>
            </div>
          ) : null}
          {prediction.dashaLine ? (
            <p className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-2 text-indigo-950">
              <span className="font-medium">{t("predictions.dashaContextLabel")}</span> {prediction.dashaLine}
            </p>
          ) : null}
          {prediction.timingLine ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800">
              <span className="font-medium">{t("predictions.timingContextLabel")}</span> {prediction.timingLine}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-indigo-900">{t("predictions.career")}:</span> {prediction.career}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("predictions.finance")}:</span> {prediction.finance}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("predictions.health")}:</span> {prediction.health}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("predictions.relationships")}:</span>{" "}
            {prediction.relationships}
          </p>
          <p>
            <span className="font-medium text-indigo-900">{t("predictions.luckyLabel")}:</span> {prediction.lucky.color},{" "}
            {prediction.lucky.number}, {prediction.lucky.direction}
          </p>
          <p className="text-slate-600">
            <span className="font-medium text-indigo-900">{t("predictions.rating")}:</span> {prediction.rating}/5
          </p>
          <p className="text-xs text-slate-500">{t("predictions.apiHint")}</p>
        </div>
      ) : null}
    </Card>
  );
}
