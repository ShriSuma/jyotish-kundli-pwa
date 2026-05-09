import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { analytics } from "../core/analytics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt(): JSX.Element | null {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(localStorage.getItem("installDismissed") === "true");

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferredPrompt) return null;

  return (
    <div
      data-testid="install-prompt"
      className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-slate-800 shadow-sm"
    >
      <p className="font-medium text-indigo-950">{t("install.title")}</p>
      <p className="mt-1 text-slate-700">{t("install.message")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="jk-btn rounded-lg bg-[color:var(--jk-accent)] px-3 py-1.5 text-sm font-medium text-white"
          onClick={async () => {
            await deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === "accepted") {
              await analytics.track("app_installed");
            }
            setDeferredPrompt(null);
          }}
        >
          {t("install.install")}
        </button>
        <button
          type="button"
          className="jk-btn rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-indigo-950"
          onClick={() => {
            localStorage.setItem("installDismissed", "true");
            setDismissed(true);
          }}
        >
          {t("install.dismiss")}
        </button>
      </div>
    </div>
  );
}
