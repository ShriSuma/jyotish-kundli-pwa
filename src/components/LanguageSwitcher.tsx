import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore, type SupportedLanguage } from "../stores/appStore";

const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ta: "தமிழ்"
};

export default function LanguageSwitcher(): JSX.Element {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const onChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    await setLanguage(event.target.value as SupportedLanguage);
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium" htmlFor="language-select">
      {t("settings.language")}
      <select
        id="language-select"
        data-testid="language-switcher"
        className="rounded border border-amber-300 bg-white px-2 py-1"
        value={language}
        onChange={(event) => {
          void onChange(event);
        }}
      >
        {Object.entries(languageLabels).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
