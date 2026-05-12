import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLatestKundliRecord, type KundliRecord } from "../db/indexedDb";
import { useAppStore } from "../stores/appStore";
import Card from "../components/ui/Card";
import YogaDetailDialog from "../components/YogaDetailDialog";
import { computeKundliInsights, type KundliInsights, type YogaId } from "../core/KundliInsightsEngine";

export default function InsightsPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setPage = useAppStore((s) => s.setPage);
  const [record, setRecord] = useState<KundliRecord | null | undefined>(undefined);
  const [yogaDialogId, setYogaDialogId] = useState<YogaId | null>(null);

  useEffect(() => {
    void getLatestKundliRecord().then((r) => setRecord(r ?? null));
  }, []);

  const insights = useMemo(() => (record ? computeKundliInsights(record.kundliData) : null), [record]);

  if (record === undefined) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{t("common.loading")}</p>
      </Card>
    );
  }

  if (!record || !insights) {
    return (
      <Card>
        <p className="font-medium text-indigo-950">{t("insights.emptyTitle")}</p>
        <p className="mt-2 text-sm text-slate-600">{t("insights.emptyBody")}</p>
        <button
          type="button"
          className="jk-btn mt-4 rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-medium text-white"
          onClick={() => setPage("kundli")}
        >
          {t("insights.goToKundli")}
        </button>
      </Card>
    );
  }

  const yogaTitle = (id: YogaId) => t(`insights.yogaTitles.${id}` as "insights.yogaTitles.gajakesari");
  const yogaDesc = (id: YogaId) => t(`insights.yogaDescs.${id}` as "insights.yogaDescs.gajakesari");

  const lifeLine = (area: "marriage" | "career" | "family" | "health", tone: KundliInsights["life"]["marriage"]) =>
    t(`insights.life.${area}.${tone}` as "insights.life.marriage.uplift");

  const segment = (titleKey: string, body: string) => (
    <section className="rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/30 p-4 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wide text-indigo-950">{t(titleKey)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-800">{body}</p>
    </section>
  );

  return (
    <Card key={i18n.language}>
      <h2 className="text-xl font-bold text-indigo-950">{t("insights.title")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("insights.subtitleReader")}</p>
      <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-950">
        {t("insights.disclaimerShort")}
      </p>

      <div className="mt-6 space-y-5">
        <section className="rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/30 p-4 shadow-sm">
          <h3 className="text-sm font-semibold tracking-wide text-indigo-950">{t("insights.segmentYogasTitle")}</h3>
          {insights.yogas.length === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-800">{t("insights.segmentYogasEmpty")}</p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                {t("insights.segmentYogasIntro", { count: insights.yogas.length })}
              </p>
              <ul className="mt-4 space-y-3">
                {insights.yogas.map((y) => (
                  <li key={y} className="list-none">
                    <button
                      type="button"
                      className="w-full rounded-2xl border-2 border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]/50 p-4 text-left shadow-sm transition hover:bg-[color:var(--jk-accent-soft)]"
                      onClick={() => setYogaDialogId(y)}
                    >
                      <span className="text-base font-bold text-indigo-950">{yogaTitle(y)}</span>
                      <p className="mt-2 text-sm leading-relaxed text-slate-800">{yogaDesc(y)}</p>
                      <p className="mt-2 text-xs font-medium text-[color:var(--jk-accent)]">{t("insights.yogaTapDetail")}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {segment("insights.segmentSarpaTitle", t(`insights.narrativeSarpa.${insights.kaalsarp}`))}

        {segment("insights.segmentAncestralTitle", t(`insights.narrativeAncestral.${insights.pitru.level}`))}

        {segment("insights.segmentMarriageTitle", lifeLine("marriage", insights.life.marriage))}

        <section className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
          <h3 className="text-sm font-semibold text-indigo-950">{t("insights.segmentTimingTitle")}</h3>
          {insights.marriageWindow ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-800">
              {t("insights.marriageTimingBody", {
                planet: t(`planets.${insights.marriageWindow.planet}` as "planets.Venus"),
                from: insights.marriageWindow.startAge.toFixed(1),
                to: insights.marriageWindow.endAge.toFixed(1)
              })}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-700">{t("insights.marriageTimingNone")}</p>
          )}
          <p className="mt-2 text-xs text-slate-600">{t("insights.marriageTimingHint")}</p>
        </section>

        {segment("insights.segmentFamilyTitle", lifeLine("family", insights.life.family))}

        {segment("insights.segmentCareerTitle", lifeLine("career", insights.life.career))}

        {segment("insights.segmentHealthTitle", lifeLine("health", insights.life.health))}

        {segment("insights.segmentLifePathTitle", t(`insights.lifePath.${insights.lifePath}`))}
      </div>

      <YogaDetailDialog
        open={yogaDialogId !== null}
        yogaId={yogaDialogId}
        kundli={record.kundliData}
        onClose={() => setYogaDialogId(null)}
      />
    </Card>
  );
}
