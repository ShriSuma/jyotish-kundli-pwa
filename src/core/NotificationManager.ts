import { logger } from "./logger";

export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.requestPermission();
};

export const getPermissionStatus = (): NotificationPermission => {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

export const sendTestNotification = (): void => {
  if (getPermissionStatus() !== "granted") {
    return;
  }
  try {
    new Notification("Jyotish Kundli", { body: "Notifications are enabled." });
  } catch (error) {
    logger.warn("Notification failed", error);
  }
};

