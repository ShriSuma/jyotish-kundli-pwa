import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as NotificationManager from "../core/NotificationManager";
import * as NotificationScheduler from "../core/NotificationScheduler";
import i18n from "../i18n";
import SettingsPage from "../pages/SettingsPage";
import { useAppStore } from "../stores/appStore";
import { db } from "../db/indexedDb";

describe("Settings notifications wiring", () => {
  const scheduleDaily = vi.spyOn(NotificationScheduler, "scheduleDailyPanchang").mockResolvedValue();
  const scheduleRahu = vi.spyOn(NotificationScheduler, "scheduleRahuKaal").mockResolvedValue();
  const cancelAll = vi.spyOn(NotificationScheduler, "cancelAllNotifications").mockResolvedValue();
  const getPermission = vi.spyOn(NotificationManager, "getPermissionStatus");

  beforeEach(async () => {
    await db.settings.clear();
    vi.clearAllMocks();
    getPermission.mockReturnValue("granted");
    useAppStore.setState({
      language: "en",
      chartStyle: "north",
      notifications: { dailyPanchang: false, rahuKaal: false },
      defaultLat: 13.08,
      defaultLng: 80.27,
      placeLabel: "Chennai",
      pincode: "600001"
    });
  });

  afterEach(() => {
    scheduleDaily.mockRestore();
    scheduleRahu.mockRestore();
    cancelAll.mockRestore();
    getPermission.mockRestore();
  });

  it("enabling daily Panchang calls scheduler with saved coordinates", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsPage />
      </I18nextProvider>
    );

    const checkbox = screen.getByLabelText(/daily panchang reminder/i);
    await user.click(checkbox);

    await waitFor(() => {
      expect(scheduleDaily).toHaveBeenCalled();
    });
    const arg = scheduleDaily.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      tithi: expect.any(String),
      nakshatra: expect.any(String)
    });
  });
});
