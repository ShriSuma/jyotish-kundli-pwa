import { useTranslation } from "react-i18next";
import { saveSettings } from "../db/indexedDb";
import { logger } from "../core/logger";

type Props = {
  onResolved: (accepted: boolean) => void;
};

export default function PrivacyConsent({ onResolved }: Props): JSX.Element {
  const { t } = useTranslation();

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem("jk-consent", accepted ? "accepted" : "declined");
    onResolved(accepted);

    void saveSettings({
      language: (localStorage.getItem("i18nextLng") as "en" | "hi" | "kn" | "te" | "ta") || "en",
      consentChoice: accepted ? "accepted" : "declined",
      analyticsEnabled: accepted
    }).catch((error) => {
      logger.error("Failed to persist consent choice", error);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl border border-[color:var(--jk-card-border)] bg-[color:var(--jk-card-bg)] p-6 text-[color:var(--jk-card-fg)] shadow-xl">
        <h2 className="text-lg font-semibold text-indigo-950">{t("consent.title")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{t("consent.message")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="jk-btn rounded-xl bg-[color:var(--jk-accent)] px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              handleChoice(true);
            }}
          >
            {t("consent.accept")}
          </button>
          <button
            type="button"
            className="jk-btn rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-indigo-950"
            onClick={() => {
              handleChoice(false);
            }}
          >
            {t("consent.decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
