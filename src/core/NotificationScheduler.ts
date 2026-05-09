import type { PanchangOutput, RahuKaalOutput } from "./AstroTypes";
import {
  clearScheduledNotifications,
  getScheduledNotifications,
  saveScheduledNotification
} from "../db/indexedDb";

const toLocalTomorrowAtSeven = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d;
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
};

const postSWMessage = async (message: Record<string, unknown>): Promise<void> => {
  const reg = await registerServiceWorker();
  reg?.active?.postMessage(message);
};

export const scheduleDailyPanchang = async (panchang: PanchangOutput): Promise<void> => {
  const when = toLocalTomorrowAtSeven().toISOString();
  const existing = await getScheduledNotifications();
  if (existing.some((e) => e.type === "dailyPanchang" && e.scheduledTime === when)) {
    return;
  }

  await saveScheduledNotification({
    type: "dailyPanchang",
    scheduledTime: when,
    payload: {
      title: "Daily Panchang",
      body: `Tithi: ${panchang.tithi} | Nakshatra: ${panchang.nakshatra}`
    },
    fired: false
  });

  await postSWMessage({
    type: "SCHEDULE_DAILY_PANCHANG",
    scheduledTime: when,
    payload: {
      title: "Daily Panchang",
      body: `Tithi: ${panchang.tithi} | Nakshatra: ${panchang.nakshatra}`
    }
  });
};

export const scheduleRahuKaal = async (rahuKaal: RahuKaalOutput): Promise<void> => {
  const now = new Date();
  const [h, m] = rahuKaal.startTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const scheduleAt = new Date(start.getTime() - 15 * 60 * 1000).toISOString();

  const existing = await getScheduledNotifications();
  if (existing.some((e) => e.type === "rahuKaal" && e.scheduledTime === scheduleAt)) {
    return;
  }

  await saveScheduledNotification({
    type: "rahuKaal",
    scheduledTime: scheduleAt,
    payload: {
      title: "Rahu Kaal Alert",
      body: `Rahu Kaal starts at ${rahuKaal.startTime}. Avoid new tasks.`
    },
    fired: false
  });

  await postSWMessage({
    type: "SCHEDULE_RAHU_KAAL",
    scheduledTime: scheduleAt,
    payload: {
      title: "Rahu Kaal Alert",
      body: `Rahu Kaal starts at ${rahuKaal.startTime}. Avoid new tasks.`
    }
  });
};

export const cancelAllNotifications = async (type?: "dailyPanchang" | "rahuKaal"): Promise<void> => {
  await clearScheduledNotifications(type);
  await postSWMessage({
    type: "CANCEL_ALL",
    notificationType: type
  });
};

