import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import "../i18n";
import { analytics } from "../core/analytics";
import { db, getAnalyticsEventCounts, saveSettings } from "../db/indexedDb";

describe("Privacy and analytics", () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.kundlis.clear();
    await db.panchangCache.clear();
    await db.predictionCache.clear();
    await db.scheduledNotifications.clear();
    await db.analyticsEvents.clear();
    localStorage.clear();
  });

  it("consent modal blocks UI", () => {
    render(<App />);
    expect(screen.getByText(/privacy first/i)).toBeInTheDocument();
  });

  it("decline keeps analytics no-op", async () => {
    render(<App />);
    await userEvent.click(screen.getAllByRole("button", { name: /decline/i })[0]);
    await analytics.init();
    await analytics.track("app_loaded");
    expect(await getAnalyticsEventCounts()).toEqual({});
  });

  it("accept stores analytics events", async () => {
    await saveSettings({ language: "en", analyticsEnabled: true, consentChoice: "accepted" });
    await analytics.init();
    await analytics.track("app_loaded");
    expect((await getAnalyticsEventCounts()).app_loaded).toBeGreaterThanOrEqual(1);
  });
});

