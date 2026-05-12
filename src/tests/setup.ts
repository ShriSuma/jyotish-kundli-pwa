import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { beforeEach, vi } from "vitest";
import { db } from "../db/indexedDb";

vi.mock("../core/resolvePanchangCoords", () => ({
  resolvePanchangCoords: vi.fn(async (lat: number, lng: number) => ({ lat, lng }))
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
});

Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: (success: (pos: GeolocationPosition) => void) =>
      success({
        coords: {
          latitude: 19.076,
          longitude: 72.8777,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      } as GeolocationPosition)
  },
  configurable: true
});

Object.defineProperty(global, "Notification", {
  value: class {
    static permission: NotificationPermission = "granted";
    static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
    constructor(_title: string, _opts?: NotificationOptions) {}
  },
  configurable: true
});

beforeEach(async () => {
  if (!db.isOpen()) {
    await db.open();
  }
});
