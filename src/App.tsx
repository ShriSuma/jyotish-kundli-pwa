import { useEffect } from "react";
import { analytics } from "./core/analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PrivacyConsent from "./components/PrivacyConsent";
import HomePage from "./pages/HomePage";
import KundliPage from "./pages/KundliPage";
import MelapakPage from "./pages/MelapakPage";
import PredictionsPage from "./pages/PredictionsPage";
import SettingsPage from "./pages/SettingsPage";
import InsightsPage from "./pages/InsightsPage";
import { useAppStore } from "./stores/appStore";

export default function App(): JSX.Element {
  const currentPage = useAppStore((state) => state.currentPage);
  const hydrateSettings = useAppStore((state) => state.hydrateSettings);
  const consentResolved = useAppStore((state) => state.consentResolved);
  const setConsentResolved = useAppStore((state) => state.setConsentResolved);

  useEffect(() => {
    const run = async () => {
      await hydrateSettings();
      await analytics.init();
      await analytics.track("app_loaded");
    };
    void run();
  }, [hydrateSettings]);

  return (
    <ErrorBoundary>
      {!consentResolved && (
        <PrivacyConsent
          onResolved={() => {
            setConsentResolved(true);
          }}
        />
      )}
      <Layout>
        {currentPage === "home" && <HomePage />}
        {currentPage === "kundli" && <KundliPage />}
        {currentPage === "predictions" && <PredictionsPage />}
        {currentPage === "insights" && <InsightsPage />}
        {currentPage === "melapak" && <MelapakPage />}
        {currentPage === "settings" && <SettingsPage />}
      </Layout>
    </ErrorBoundary>
  );
}
