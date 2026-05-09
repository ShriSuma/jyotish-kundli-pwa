import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDailyPrediction, getMonthlyPrediction, getWeeklyPrediction } from "../core/PredictionEngine";
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
  const [tab, setTab] = useState<Tab>("daily");
  const [prediction, setPrediction] = useState<PredictionOutput | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const load = async () => {
      const kundli = await getLatestKundliRecord();
      if (!kundli) {
        setEmpty(true);
        return;
      }
      setEmpty(false);
      const lang = (i18n.resolvedLanguage ?? i18n.language).split("-")[0];
      const key =
        tab === "daily"
          ? new Date().toISOString().slice(0, 10)
          : tab === "weekly"
            ? `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}`
            : `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      const cached = await getPredictionCache(kundli.id!, tab, key, lang);
      if (cached) {
        setPrediction(cached);
        return;
      }
      const generated =
        tab === "daily"
          ? getDailyPrediction(kundli.kundliData, new Date(), t, kundli.name)
          : tab === "weekly"
            ? getWeeklyPrediction(kundli.kundliData, new Date(), t, kundli.name)
            : getMonthlyPrediction(
                kundli.kundliData,
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                t,
                kundli.name
              );
      await savePredictionCache(kundli.id!, tab, key, lang, generated);
      setPrediction(generated);
      await analytics.track("prediction_viewed", { tab });
    };
    void load();
  }, [tab, i18n.language, i18n.resolvedLanguage, t]);

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
      {prediction && (
        <div className="space-y-2 text-sm text-slate-800">
          <h3 className="text-lg font-semibold text-indigo-950">{prediction.title}</h3>
          <p>{prediction.summary}</p>
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
        </div>
      )}
    </Card>
  );
}
