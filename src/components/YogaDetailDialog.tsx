import { useTranslation } from "react-i18next";
import type { KundliOutput } from "../core/AstroTypes";
import { yogaDialogVars, type YogaId } from "../core/KundliInsightsEngine";

type Props = {
  open: boolean;
  yogaId: YogaId | null;
  kundli: KundliOutput | null;
  onClose: () => void;
};

export default function YogaDetailDialog({ open, yogaId, kundli, onClose }: Props): JSX.Element | null {
  const { t } = useTranslation();
  if (!open || !yogaId || !kundli) return null;

  const vars = yogaDialogVars(kundli);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yoga-dialog-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="yoga-dialog-title" className="text-lg font-bold text-indigo-950">
          {t(`insights.yogaTitles.${yogaId}` as "insights.yogaTitles.gajakesari")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-800">
          {t(`insights.yogaDialog.${yogaId}.what` as "insights.yogaDialog.gajakesari.what")}
        </p>
        <p className="mt-3 text-sm font-semibold text-indigo-900">{t("insights.yogaDialog.impactHeading")}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">
          {t(`insights.yogaDialog.${yogaId}.impact` as "insights.yogaDialog.gajakesari.impact")}
        </p>
        <p className="mt-3 text-sm font-semibold text-indigo-900">{t("insights.yogaDialog.whyHeading")}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">
          {t(`insights.yogaDialog.${yogaId}.whyThis` as "insights.yogaDialog.gajakesari.whyThis", vars)}
        </p>
        <button
          type="button"
          className="jk-btn mt-5 w-full rounded-xl bg-[color:var(--jk-accent)] py-2.5 text-sm font-semibold text-white"
          onClick={onClose}
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
