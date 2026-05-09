/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request, url }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.endsWith(".json"),
  new StaleWhileRevalidate({
    cacheName: "jk-static-assets"
  })
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new CacheFirst({
    cacheName: "jk-app-shell"
  })
);

type ScheduleMessage = {
  type: "SCHEDULE_DAILY_PANCHANG" | "SCHEDULE_RAHU_KAAL" | "CANCEL_ALL";
  scheduledTime?: string;
  payload?: { title?: string; body?: string };
  notificationType?: "dailyPanchang" | "rahuKaal";
};

const scheduled = new Map<string, number>();

const showNotification = async (title: string, body: string, tag: string, data: Record<string, unknown>) => {
  await self.registration.showNotification(title, {
    body,
    tag,
    data
  });
};

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const message = event.data as ScheduleMessage;
  if (!message || !message.type) return;

  if (message.type === "CANCEL_ALL") {
    for (const timeoutId of scheduled.values()) {
      clearTimeout(timeoutId);
    }
    scheduled.clear();
    return;
  }

  if (!message.scheduledTime) return;
  const runAt = new Date(message.scheduledTime).getTime();
  const delay = Math.max(0, runAt - Date.now());
  const key = `${message.type}-${message.scheduledTime}`;

  if (scheduled.has(key)) return;

  const timeoutId = setTimeout(() => {
    void showNotification(
      message.payload?.title ?? "Jyotish Kundli",
      message.payload?.body ?? "Astrology update available",
      message.type,
      { route: "/" }
    );
    scheduled.delete(key);
  }, delay) as unknown as number;

  scheduled.set(key, timeoutId);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
