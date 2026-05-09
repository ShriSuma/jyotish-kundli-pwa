import { getSettings, saveAnalyticsEvent } from "../db/indexedDb";

let enabled = false;

export const analytics = {
  init: async () => {
    const settings = await getSettings();
    enabled = Boolean(settings?.analyticsEnabled);
  },
  track: async (eventName: string, payload: Record<string, unknown> = {}) => {
    if (!enabled) {
      return;
    }
    await saveAnalyticsEvent(eventName, payload);
  }
};

