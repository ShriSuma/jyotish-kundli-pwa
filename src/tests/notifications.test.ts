import { beforeEach, describe, expect, it } from "vitest";
import { cancelAllNotifications, scheduleDailyPanchang, scheduleRahuKaal } from "../core/NotificationScheduler";
import { db, getScheduledNotifications } from "../db/indexedDb";

describe("Notification scheduler", () => {
  beforeEach(async () => {
    await db.scheduledNotifications.clear();
  });

  it("stores scheduled records", async () => {
    await scheduleDailyPanchang({
      tithi: "T",
      nakshatra: "N",
      yoga: "Y",
      karana: "K",
      paksha: "Shukla",
      sunrise: "06:00",
      sunset: "18:00",
      moonrise: "07:00"
    });
    expect((await getScheduledNotifications()).length).toBe(1);
  });

  it("prevents duplicates", async () => {
    const payload = { startTime: "09:00", endTime: "10:30", isActive: false };
    await scheduleRahuKaal(payload);
    await scheduleRahuKaal(payload);
    expect((await getScheduledNotifications()).length).toBe(1);
  });

  it("cancel clears records", async () => {
    await scheduleRahuKaal({ startTime: "08:00", endTime: "09:00", isActive: false });
    await cancelAllNotifications();
    expect((await getScheduledNotifications()).length).toBe(0);
  });
});

