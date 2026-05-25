import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getLatestKundliRecord, type KundliRecord } from "../db/indexedDb";
import { useAppStore } from "../stores/appStore";
import Card from "../components/ui/Card";
import YogaDetailDialog from "../components/YogaDetailDialog";
import InsightTabPanel, { type InsightTabId } from "../components/insights/InsightTabPanel";
import { computeDoshaLifeReport } from "../core/DoshaLifeEngine";
import { generateKundliReading } from "../core/KundliReadingEngine";
import { normalizeKundliHouses } from "../core/houseNormalize";
import { type YogaId } from "../core/KundliInsightsEngine";
import { calculateKundliWithPlaceSun } from "../core/KundliEngine";
import type { KundliOutput } from "../core/AstroTypes";
import { POOJA_CONTACT_PHONE, POOJA_CONTACT_TEL } from "../data/poojaRecommendations";
import { fetchHouseNarrativesPolish } from "../services/kundliNarrativeApi";

const sectionCard = (title: string, body: ReactNode, extraClass = "") => (
  <section
    className={`rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/30 p-4 shadow-sm ${extraClass}`}
  >
    <h3 className="text-sm font-semibold tracking-wide text-indigo-950">{title}</h3>
    <div className="mt-2 text-sm leading-relaxed text-slate-800">{body}</div>
  </section>
);

const listSection = (title: string, items: string[]) =>
  items.length > 0 ? (
    sectionCard(
      title,
      <ul className="list-inside list-disc space-y-1">
        {items.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
        ))}
      </ul>
    )
  ) : null;

export default function InsightsPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setPage = useAppStore((s) => s.setPage);
  const narrativeConsent = useAppStore((s) => s.narrativeConsent);
  const ayanamsaModel = useAppStore((s) => s.ayanamsaModel);
  const nodeType = useAppStore((s) => s.nodeType);
  const [record, setRecord] = useState<KundliRecord | null | undefined>(undefined);
  const [liveKundli, setLiveKundli] = useState<KundliOutput | null>(null);
  const [aiHouseTexts, setAiHouseTexts] = useState<string[] | null>(null);
  const [yogaDialogId, setYogaDialogId] = useState<YogaId | null>(null);
  const [tab, setTab] = useState<InsightTabId>("overview");

  useEffect(() => {
    void getLatestKundliRecord().then((r) => setRecord(r ?? null));
  }, []);

  const birth = useMemo(
    () =>
      record
        ? {
            birthDate: record.birthDate,
            birthTime: record.birthTime,
            latitude: record.latitude,
            longitude: record.longitude
          }
        : undefined,
    [record]
  );

  // Recompute chart from birth data with CURRENT ayanamsa/node settings
  // (fixes cases where stored kundli was generated with a previous setting)
  useEffect(() => {
    if (!record) {
      setLiveKundli(null);
      return;
    }
    let cancelled = false;
    void calculateKundliWithPlaceSun(
      {
        name: record.name,
        birthDate: record.birthDate,
        birthTime: record.birthTime,
        latitude: record.latitude,
        longitude: record.longitude,
        gothra: record.gothra,
        pincode: record.pincode
      },
      { ayanamsaModel, nodeType }
    )
      .then((k) => {
        if (!cancelled) setLiveKundli(k);
      })
      .catch(() => {
        if (!cancelled) setLiveKundli(record.kundliData);
      });
    return () => {
      cancelled = true;
    };
  }, [record, ayanamsaModel, nodeType]);

  const activeKundli = liveKundli ?? record?.kundliData ?? null;

  const report = useMemo(() => {
    if (!activeKundli) return null;
    return computeDoshaLifeReport(activeKundli, birth);
  }, [activeKundli, birth]);

  const reading = useMemo(() => {
    if (!activeKundli || !report) return null;
    return generateKundliReading(activeKundli, birth, t, report, i18n.language);
  }, [activeKundli, report, birth, t, i18n.language]);

  useEffect(() => {
    if (!activeKundli || !narrativeConsent) {
      setAiHouseTexts(null);
      return;
    }
    let cancelled = false;
    setAiHouseTexts(null);
    void fetchHouseNarrativesPolish(activeKundli, i18n.language)
      .then((houses) => {
        if (!cancelled) setAiHouseTexts(houses);
      })
      .catch(() => {
        if (!cancelled) setAiHouseTexts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeKundli, narrativeConsent, i18n.language]);

  if (record === undefined) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{t("common.loading")}</p>
      </Card>
    );
  }

  if (!record || !report || !reading) {
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

  const insights = report.insights;
  const yogaTitle = (id: YogaId) => t(`insights.yogaTitles.${id}` as "insights.yogaTitles.gajakesari");
  const yogaDesc = (id: YogaId) => t(`insights.yogaDescs.${id}` as "insights.yogaDescs.gajakesari");

  const tabs: { id: InsightTabId; label: string }[] = [
    { id: "overview", label: t("insights.tabs.overview") },
    { id: "houses", label: t("insights.tabs.houses") },
    { id: "doshas", label: t("insights.tabs.doshas") },
    { id: "marriage", label: t("insights.tabs.marriage") },
    { id: "family", label: t("insights.tabs.family") },
    { id: "longevity", label: t("insights.tabs.longevity") },
    { id: "remedies", label: t("insights.tabs.remedies") }
  ];

  const doshaBadge = (active: boolean, label: string) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-rose-100 text-rose-900" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {label}
    </span>
  );

  return (
    <Card key={i18n.language}>
      <h2 className="text-xl font-bold text-indigo-950">{t("insights.title")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("insights.subtitleReader")}</p>
      <p className="mt-2 text-xs font-medium text-indigo-800">{t("reading.fromKundliLabel")}</p>
      <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-950">
        {t("insights.disclaimerShort")}
      </p>

      <div className="mt-6">
        <InsightTabPanel tabs={tabs} active={tab} onChange={setTab}>
          {tab === "overview" && (
            <div className="space-y-4">
              {sectionCard(
                t("insights.currentScenarioTitle"),
                <>
                  <p>{reading.intro}</p>
                  <p className="mt-2">{reading.lagnaLine}</p>
                  {reading.ageLine ? <p className="mt-2">{reading.ageLine}</p> : null}
                  <p className="mt-2 font-medium text-indigo-900">{reading.dashaLine}</p>
                  {reading.currentPhase && reading.currentPhase !== reading.dashaLine ? (
                    <p className="mt-2">{reading.currentPhase}</p>
                  ) : null}
                </>
              )}
              {listSection(t("reading.strengthsTitle"), reading.strengths)}
              {listSection(t("reading.cautionsTitle"), reading.cautions)}
              {reading.dashaCautionLines.length > 0
                ? listSection(t("reading.dashaCautionTitle"), reading.dashaCautionLines)
                : null}
              {listSection(t("reading.housesTitle"), reading.houseNotes)}
              {sectionCard(
                t("insights.segmentCareerTitle"),
                <>
                  <p>{reading.career}</p>
                  <p className="mt-2">{reading.careerJobs}</p>
                </>
              )}
              {sectionCard(t("insights.segmentHealthTitle"), <p>{reading.health}</p>)}
              {insights.yogas.length > 0
                ? sectionCard(
                    t("insights.segmentYogasTitle"),
                    <>
                      <p className="mb-3">{t("insights.segmentYogasIntro", { count: insights.yogas.length })}</p>
                      <ul className="space-y-2">
                        {insights.yogas.map((y) => (
                          <li key={y}>
                            <button
                              type="button"
                              className="w-full rounded-xl border border-indigo-100 bg-white p-3 text-left hover:bg-indigo-50/50"
                              onClick={() => setYogaDialogId(y)}
                            >
                              <span className="font-semibold text-indigo-950">{yogaTitle(y)}</span>
                              <p className="mt-1 text-xs text-slate-600">{yogaDesc(y)}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                : null}
            </div>
          )}

          {tab === "houses" && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">{t("reading.housesGuideIntro")}</p>
              {reading.housePredictions.map((hp) => (
                <section
                  key={hp.house}
                  className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-950">
                        {hp.house}. {t(hp.nameKey as "reading.houseNames.h1")}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-indigo-800">
                        {t(`reading.houseSections.h${hp.house}` as "reading.houseSections.h1")}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                      {t("reading.scoreLabel", { score: hp.score, stars: hp.stars })}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        hp.score >= 65
                          ? "bg-emerald-500"
                          : hp.score >= 45
                            ? "bg-amber-400"
                            : "bg-rose-400"
                      }`}
                      style={{ width: `${hp.score}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-800">
                    {aiHouseTexts?.[hp.house - 1] ?? hp.prediction}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{t("reading.houseBodyLabel")}: </span>
                    {hp.bodyParts}
                  </p>
                </section>
              ))}
            </div>
          )}

          {tab === "doshas" && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">{t("insights.doshaTabIntro")}</p>

              <section
                className={`rounded-2xl border-2 p-4 ${
                  report.doshaFlags.hasKaalsarp
                    ? "border-rose-200 bg-rose-50/80"
                    : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <h3 className="text-sm font-semibold text-indigo-950">{t("insights.doshaKaalsarp.title")}</h3>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {report.doshaFlags.hasKaalsarp
                    ? t("insights.doshaStatus.found")
                    : t("insights.doshaStatus.notFound")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {report.doshaFlags.hasKaalsarp
                    ? t(`insights.doshaKaalsarp.implication.${report.kaalsarp.kind}` as "insights.doshaKaalsarp.implication.full")
                    : t("insights.doshaKaalsarp.clear")}
                </p>
                {report.kaalsarp.type ? (
                  <p className="mt-2 rounded-lg bg-white/80 p-2 text-sm font-medium text-rose-950">
                    {t("insights.kaalsarpTypeLabel")}: {t(`insights.kalaSarpaTypes.${report.kaalsarp.type}`)}
                  </p>
                ) : null}
              </section>

              <section
                className={`rounded-2xl border-2 p-4 ${
                  report.doshaFlags.hasSarpa
                    ? "border-rose-200 bg-rose-50/80"
                    : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <h3 className="text-sm font-semibold text-indigo-950">{t("insights.doshaSarpa.title")}</h3>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {report.doshaFlags.hasSarpa
                    ? t("insights.doshaStatus.found")
                    : t("insights.doshaStatus.notFound")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {report.doshaFlags.hasSarpa
                    ? t("insights.doshaSarpa.implication")
                    : t("insights.doshaSarpa.clear")}
                </p>
                {report.sarpaDosha.active ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-800">
                    {report.sarpaDosha.hits.map((h, i) => (
                      <li key={`${h.node}-${h.ref}-${i}`}>
                        {t("insights.sarpaDoshaHit", {
                          node: t(`planets.${h.node}` as "planets.Rahu"),
                          ref: t(`insights.sarpaRef.${h.ref}`),
                          house: t("reading.houseN", { n: h.house })
                        })}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section
                className={`rounded-2xl border-2 p-4 ${
                  report.doshaFlags.hasPitru
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <h3 className="text-sm font-semibold text-indigo-950">{t("insights.doshaPitru.title")}</h3>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {report.doshaFlags.hasPitru
                    ? t("insights.doshaStatus.found")
                    : t("insights.doshaStatus.notFound")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {report.doshaFlags.hasPitru
                    ? t(`insights.doshaPitru.implication.${insights.pitru.level}` as "insights.doshaPitru.implication.mild")
                    : t("insights.doshaPitru.clear")}
                </p>
                {report.pitruReasons.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-800">
                    {report.pitruReasons.map((r) => (
                      <li key={r}>{t(`insights.pitruReasons.${r}`)}</li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section
                className={`rounded-2xl border-2 p-4 ${
                  report.guruChandal
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <h3 className="text-sm font-semibold text-indigo-950">{t("insights.doshaGuruChandal.title")}</h3>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {report.guruChandal ? t("insights.doshaStatus.found") : t("insights.doshaStatus.notFound")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {report.guruChandal
                    ? t("insights.doshaGuruChandal.implication")
                    : t("insights.doshaGuruChandal.clear")}
                </p>
              </section>

              {!report.doshaFlags.hasKaalsarp &&
              !report.doshaFlags.hasSarpa &&
              !report.doshaFlags.hasPitru &&
              !report.guruChandal
                ? sectionCard(t("insights.doshaAllClearTitle"), <p>{t("insights.doshaAllClearBody")}</p>)
                : null}

              <p className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950">
                {t("insights.doshaConsultNote")}
              </p>
            </div>
          )}

          {tab === "marriage" && (
            <div className="space-y-4">
              {sectionCard(t("insights.segmentMarriageTitle"), <p>{reading.marriage}</p>)}
              {sectionCard(
                t("insights.segmentTimingTitle"),
                insights.marriageWindow ? (
                  <>
                    <p>
                      {t("insights.marriageTimingBody", {
                        planet: t(`planets.${insights.marriageWindow.planet}` as "planets.Venus"),
                        from: insights.marriageWindow.startAge.toFixed(1),
                        to: insights.marriageWindow.endAge.toFixed(1)
                      })}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">{t("insights.marriageTimingHint")}</p>
                  </>
                ) : (
                  <p>{t("insights.marriageTimingNone")}</p>
                )
              )}
            </div>
          )}

          {tab === "family" && (
            <div className="space-y-4">{sectionCard(t("insights.segmentFamilyTitle"), <p>{reading.family}</p>)}</div>
          )}

          {tab === "longevity" && (
            <div className="space-y-4">
              {sectionCard(
                t("insights.longevityTitle"),
                <>
                  <p className="text-lg font-semibold text-indigo-950">{reading.longevityLine}</p>
                  {report.longevity.factorKeys.length > 0 ? (
                    <ul className="mt-3 list-inside list-disc text-sm">
                      {report.longevity.factorKeys.map((fk) => (
                        <li key={fk}>{t(`insights.longevityFactors.${fk}`)}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 p-2 text-xs text-amber-950">
                    {t("insights.longevityDisclaimer")}
                  </p>
                </>
              )}
            </div>
          )}

          {tab === "remedies" && (
            <div className="space-y-4">
              {sectionCard(
                t("insights.remediesDoshaTitle"),
                <>
                  <p>{reading.doshaLine}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doshaBadge(report.doshaFlags.hasKaalsarp, t("insights.doshaFlags.kaalsarp"))}
                    {doshaBadge(report.doshaFlags.hasSarpa, t("insights.doshaFlags.sarpa"))}
                    {doshaBadge(report.doshaFlags.hasPitru, t("insights.doshaFlags.pitru"))}
                    {doshaBadge(report.doshaFlags.hasGuruChandal, t("insights.doshaFlags.guruChandal"))}
                  </div>
                </>
              )}

              <section className="rounded-2xl border-2 border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)]/40 p-4">
                <h3 className="text-sm font-semibold text-indigo-950">{t("insights.remediesContactTitle")}</h3>
                <p className="mt-2 text-sm text-slate-800">{t("insights.remediesContactBody")}</p>
                <a
                  href={POOJA_CONTACT_TEL}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[color:var(--jk-accent)] px-4 py-2.5 text-base font-bold text-white shadow-sm"
                >
                  📞 {POOJA_CONTACT_PHONE}
                </a>
                <p className="mt-2 text-xs text-slate-600">{t("insights.remediesContactHint")}</p>
              </section>

              {report.recommendedPoojas.length === 0
                ? sectionCard(t("insights.poojaNoneTitle"), t("insights.poojaNoneBody"))
                : report.recommendedPoojas.map((p) => (
                    <section key={p.id} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                      <h3 className="font-semibold text-indigo-950">
                        {t(`insights.poojas.items.${p.titleKey}` as "insights.poojas.items.kaalSarpaTrimbakeshwar")}
                      </h3>
                      <p className="mt-2 text-sm text-slate-800">
                        {t(`insights.poojas.items.${p.descKey}` as "insights.poojas.items.kaalSarpaTrimbakeshwarDesc")}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium text-indigo-900">{t("insights.poojaWhere")}: </span>
                        {t(
                          `insights.poojas.items.${p.locationKey}` as "insights.poojas.items.kaalSarpaTrimbakeshwarLoc"
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        <span className="font-medium">{t("insights.poojaCost")}: </span>
                        {t(`insights.poojas.items.${p.costKey}` as "insights.poojas.items.kaalSarpaTrimbakeshwarCost")}
                      </p>
                      <a
                        href={POOJA_CONTACT_TEL}
                        className="jk-btn mt-3 inline-block rounded-lg border border-[color:var(--jk-accent)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--jk-accent)]"
                      >
                        {t("insights.poojaBookCall", { phone: POOJA_CONTACT_PHONE })}
                      </a>
                    </section>
                  ))}

              <p className="text-xs text-slate-600">{t("insights.poojaVerifyNote")}</p>
            </div>
          )}
        </InsightTabPanel>
      </div>

      <YogaDetailDialog
        open={yogaDialogId !== null}
        yogaId={yogaDialogId}
        kundli={activeKundli}
        onClose={() => setYogaDialogId(null)}
      />
    </Card>
  );
}
