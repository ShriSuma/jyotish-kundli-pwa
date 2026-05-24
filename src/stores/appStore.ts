import i18n from "i18next";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSettings, saveSettings } from "../db/indexedDb";
import { hydrateMissingTranslations } from "../services/i18nHydrate";
import type { AyanamsaModel, NodeType } from "../core/AstroTypes";

export type SupportedLanguage = "en" | "hi" | "kn" | "te" | "ta";
export type AppPage = "home" | "kundli" | "predictions" | "insights" | "settings" | "melapak";

const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777;
const DEFAULT_LABEL = "Mumbai";

const nearDefaultMumbai = (lat: number, lng: number): boolean =>
  Math.abs(lat - DEFAULT_LAT) < 0.02 && Math.abs(lng - DEFAULT_LNG) < 0.02;

/** When `locationConfirmed` is unset in DB, treat customised coordinates as already confirmed (migration). */
const inferLocationConfirmed = (settings?: {
  locationConfirmed?: boolean;
  defaultLat?: number;
  defaultLng?: number;
}): boolean => {
  if (settings?.locationConfirmed === true) return true;
  if (settings?.locationConfirmed === false) return false;
  const la = settings?.defaultLat ?? DEFAULT_LAT;
  const lo = settings?.defaultLng ?? DEFAULT_LNG;
  return !nearDefaultMumbai(la, lo);
};

type AppState = {
  currentPage: AppPage;
  language: SupportedLanguage;
  chartStyle: "north" | "south";
  consentResolved: boolean;
  notifications: { dailyPanchang: boolean; rahuKaal: boolean };
  defaultLat: number;
  defaultLng: number;
  placeLabel: string;
  pincode: string;
  locationConfirmed: boolean;
  narrativeConsent: boolean;
  ayanamsaModel: AyanamsaModel;
  nodeType: NodeType;
  setPage: (page: AppPage) => void;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  setChartStyle: (style: "north" | "south") => Promise<void>;
  setConsentResolved: (value: boolean) => void;
  setNotifications: (value: { dailyPanchang: boolean; rahuKaal: boolean }) => Promise<void>;
  setDefaultLocation: (lat: number, lng: number, placeLabel: string, pincode: string) => Promise<void>;
  setLocationConfirmed: (value: boolean) => Promise<void>;
  setNarrativeConsent: (value: boolean) => Promise<void>;
  setAyanamsaModel: (value: AyanamsaModel) => Promise<void>;
  setNodeType: (value: NodeType) => Promise<void>;
  hydrateSettings: () => Promise<void>;
};

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  ["en", "hi", "kn", "te", "ta"].includes(value);

const detectedLanguage = isSupportedLanguage(i18n.language) ? i18n.language : "en";

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: "home",
      language: detectedLanguage,
      chartStyle: "north",
      consentResolved: false,
      notifications: { dailyPanchang: false, rahuKaal: false },
      defaultLat: DEFAULT_LAT,
      defaultLng: DEFAULT_LNG,
      placeLabel: DEFAULT_LABEL,
      pincode: "",
      locationConfirmed: false,
      narrativeConsent: false,
      ayanamsaModel: "lahiri",
      nodeType: "mean",
      setPage: (page) => set({ currentPage: page }),
      setLanguage: async (language) => {
        localStorage.setItem("i18nextLng", language);
        await i18n.changeLanguage(language);
        if (language !== "en") {
          try {
            await hydrateMissingTranslations(language);
          } catch {
            /* offline or API unavailable — language still switches */
          }
        }
        await saveSettings({ language });
        set({ language });
      },
      setChartStyle: async (style) => {
        const existing = await getSettings();
        await saveSettings({ language: existing?.language ?? "en", chartStyle: style });
        set({ chartStyle: style });
      },
      setConsentResolved: (value) => set({ consentResolved: value }),
      setNotifications: async (value) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          notificationSettings: value
        });
        set({ notifications: value });
      },
      setDefaultLocation: async (lat, lng, placeLabel, pincode) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          defaultLat: lat,
          defaultLng: lng,
          placeLabel,
          pincode,
          locationConfirmed: true
        });
        set({ defaultLat: lat, defaultLng: lng, placeLabel, pincode, locationConfirmed: true });
      },
      setLocationConfirmed: async (value) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          locationConfirmed: value
        });
        set({ locationConfirmed: value });
      },
      setNarrativeConsent: async (value) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          narrativeConsent: value
        });
        set({ narrativeConsent: value });
      },
      setAyanamsaModel: async (value: AyanamsaModel) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          ayanamsaModel: value
        });
        set({ ayanamsaModel: value });
      },
      setNodeType: async (value: NodeType) => {
        const existing = await getSettings();
        await saveSettings({
          language: existing?.language ?? "en",
          nodeType: value
        });
        set({ nodeType: value });
      },
      hydrateSettings: async () => {
        const consentFromLocalStorage = localStorage.getItem("jk-consent");
        const hasLocalConsent =
          consentFromLocalStorage === "accepted" || consentFromLocalStorage === "declined";
        const settings = await getSettings();
        if (settings?.language && isSupportedLanguage(settings.language)) {
          await i18n.changeLanguage(settings.language);
          if (settings.language !== "en") {
            void hydrateMissingTranslations(settings.language).catch(() => {});
          }
          set({
            language: settings.language,
            chartStyle: settings.chartStyle ?? "north",
            notifications: settings.notificationSettings ?? { dailyPanchang: false, rahuKaal: false },
            consentResolved: Boolean(settings.consentChoice) || hasLocalConsent,
            defaultLat: settings.defaultLat ?? DEFAULT_LAT,
            defaultLng: settings.defaultLng ?? DEFAULT_LNG,
            placeLabel: settings.placeLabel ?? DEFAULT_LABEL,
            pincode: settings.pincode ?? "",
            locationConfirmed: inferLocationConfirmed(settings),
            narrativeConsent: Boolean(settings.narrativeConsent),
            ayanamsaModel: settings.ayanamsaModel ?? "lahiri",
            nodeType: settings.nodeType ?? "mean"
          });
          return;
        }

        if (isSupportedLanguage(i18n.language)) {
          set({
            language: i18n.language,
            consentResolved: hasLocalConsent,
            defaultLat: settings?.defaultLat ?? DEFAULT_LAT,
            defaultLng: settings?.defaultLng ?? DEFAULT_LNG,
            placeLabel: settings?.placeLabel ?? DEFAULT_LABEL,
            pincode: settings?.pincode ?? "",
            locationConfirmed: inferLocationConfirmed(settings),
            narrativeConsent: Boolean(settings?.narrativeConsent),
            ayanamsaModel: settings?.ayanamsaModel ?? "lahiri",
            nodeType: settings?.nodeType ?? "mean"
          });
        }
      }
    }),
    {
      name: "jk-app-store",
      partialize: (state) => ({
        language: state.language,
        currentPage: state.currentPage,
        chartStyle: state.chartStyle,
        notifications: state.notifications,
        defaultLat: state.defaultLat,
        defaultLng: state.defaultLng,
        placeLabel: state.placeLabel,
        pincode: state.pincode,
        locationConfirmed: state.locationConfirmed,
        narrativeConsent: state.narrativeConsent,
        ayanamsaModel: state.ayanamsaModel,
        nodeType: state.nodeType
      })
    }
  )
);
