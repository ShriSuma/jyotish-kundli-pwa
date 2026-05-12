import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import * as SunApi from "../core/sunriseSunsetApi";
import HomePage from "../pages/HomePage";
import KundliPage from "../pages/KundliPage";
import PredictionsPage from "../pages/PredictionsPage";
import SettingsPage from "../pages/SettingsPage";
import "../i18n";
import { useAppStore } from "../stores/appStore";
import { db } from "../db/indexedDb";

describe("UI pages", () => {
  let sunSpy: MockInstance;

  beforeEach(async () => {
    sunSpy = vi.spyOn(SunApi, "fetchSunriseSunsetUtc").mockResolvedValue({
      sunrise: new Date("2026-05-12T00:34:45+00:00"),
      sunset: new Date("2026-05-12T13:23:25+00:00")
    });
    await db.settings.clear();
    await db.kundlis.clear();
    await db.panchangCache.clear();
    await db.predictionCache.clear();
    await db.scheduledNotifications.clear();
    await db.analyticsEvents.clear();
    useAppStore.setState({
      currentPage: "home",
      language: "en",
      chartStyle: "north",
      notifications: { dailyPanchang: false, rahuKaal: false },
      consentResolved: true,
      defaultLat: 19.076,
      defaultLng: 72.8777,
      placeLabel: "Mumbai",
      pincode: "400001",
      locationConfirmed: true,
      narrativeConsent: false
    });
  });

  afterEach(() => {
    sunSpy?.mockRestore();
  });

  it("HomePage renders Panchang card", async () => {
    render(<HomePage />);
    expect(await screen.findByTestId("panchang-card")).toBeInTheDocument();
  });

  it("KundliPage validates required form", async () => {
    render(<KundliPage />);
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));
    expect(screen.getByText(/please fill all required fields/i)).toBeInTheDocument();
  });

  it("PredictionsPage prompts when no kundli", async () => {
    render(<PredictionsPage />);
    expect(await screen.findByText(/create your kundli first/i)).toBeInTheDocument();
  });

  it("SettingsPage language switch updates i18n", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("button", { name: /हिन्दी/i }));
    await waitFor(() => {
      expect(useAppStore.getState().language).toBe("hi");
    });
  });
});

