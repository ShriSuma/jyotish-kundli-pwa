import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import i18n from "../i18n";
import { db, getSettings } from "../db/indexedDb";
import { useAppStore } from "../stores/appStore";

describe("App smoke tests", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    await db.settings.clear();
    localStorage.clear();
    useAppStore.setState({
      currentPage: "home",
      language: "en",
      chartStyle: "north",
      notifications: { dailyPanchang: false, rahuKaal: false },
      consentResolved: false,
      defaultLat: 19.076,
      defaultLng: 72.8777,
      placeLabel: "Mumbai",
      pincode: ""
    });
    await i18n.changeLanguage("en");
  });

  it("renders app without crashing", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(screen.getAllByText(/Jyotish Kundli/i).length).toBeGreaterThan(0);
  });

  it("changes i18n locale from language switcher", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /accept/i }));
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /हिन्दी/i }));

    await waitFor(() => {
      expect(i18n.language).toBe("hi");
      expect(useAppStore.getState().language).toBe("hi");
    });
  });

  it("persists settings to indexeddb", async () => {
    await useAppStore.getState().setLanguage("ta");
    const settings = await getSettings();
    expect(settings?.language).toBe("ta");
  });
});
