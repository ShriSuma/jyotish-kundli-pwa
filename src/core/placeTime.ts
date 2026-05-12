/**
 * Rough South-Asia bbox used for IST wall-clock (matches common Jyotish desktop defaults).
 * Clock labels for Panchang at an Indian place must use this zone, not the viewer's browser TZ.
 */
export const isRoughIndiaRegion = (lat: number, lng: number): boolean =>
  lat >= 4 && lat <= 40 && lng >= 64 && lng <= 99;

/** IANA zone for displaying sun/moon civil times at the map pin; undefined = browser local (best-effort elsewhere). */
export const clockTimeZoneForPlace = (lat: number, lng: number): string | undefined =>
  isRoughIndiaRegion(lat, lng) ? "Asia/Kolkata" : undefined;

/**
 * Panchang wall-clock zone: Indian 6-digit PIN ⇒ IST (postal APIs often return 0,0 so coords alone are unreliable).
 * Otherwise India bbox ⇒ IST; else browser zone.
 */
export const panchangClockTimeZone = (lat: number, lng: number, pincode = ""): string => {
  if (/^[1-9]\d{5}$/.test(pincode.trim())) return "Asia/Kolkata";
  if (isRoughIndiaRegion(lat, lng)) return "Asia/Kolkata";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

/** BCP-47 tag for `Intl` time strings (avoids wrong hours when UI lang is `kn` vs `kn-IN`). */
export const clockLocaleFromUiLang = (uiLang: string): string => {
  const base = (uiLang || "en").split("-")[0] ?? "en";
  if (base === "kn") return "kn-IN";
  if (base === "hi") return "hi-IN";
  if (base === "te") return "te-IN";
  if (base === "ta") return "ta-IN";
  return "en-IN";
};

export const formatClockAtPlace = (d: Date, locale: string, lat: number, lng: number, pincode = ""): string => {
  const tz = panchangClockTimeZone(lat, lng, pincode);
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: tz
  });
};

/** 0=Sun … 6=Sat in the given IANA zone (en-US weekday names are stable across engines). */
export const weekdayInTimeZone = (d: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const map: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };
  return map[wd] ?? d.getDay();
};

/** Gregorian YYYY-MM-DD for `d` in the given IANA zone (en-CA yields ISO-like parts). */
export const calendarYmdInTimeZone = (d: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);

/**
 * Civil "today" for Panchang at the map pin: IST calendar date in India bbox, otherwise the browser's local zone date.
 * Matches how sites like Drik Panchang label "today" for Indian locations.
 */
export const calendarYmdForPanchangPin = (now: Date, lat: number, lng: number, pincode = ""): string => {
  if (/^[1-9]\d{5}$/.test(pincode.trim())) return calendarYmdInTimeZone(now, "Asia/Kolkata");
  const pinTz = clockTimeZoneForPlace(lat, lng);
  if (pinTz) return calendarYmdInTimeZone(now, pinTz);
  return calendarYmdInTimeZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone);
};

/**
 * Anchor instant for SunCalc / ephemeris for that Panchang civil day: noon in the pin's primary zone (IST for India).
 * Avoids picking the wrong sunrise when the viewer's UTC date differs from IST (Drik Panchang uses local Hindu date).
 */
export const panchangSolarAnchorDate = (now: Date, lat: number, lng: number, pincode = ""): Date => {
  const ymd = calendarYmdForPanchangPin(now, lat, lng, pincode);
  const useIst =
    /^[1-9]\d{5}$/.test(pincode.trim()) || clockTimeZoneForPlace(lat, lng) === "Asia/Kolkata";
  if (useIst) {
    return new Date(`${ymd}T12:00:00+05:30`);
  }
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

/** IANA zone used for civil weekday + long date line on Home (pin IST or browser zone). */
export const civilTimeZoneForPanchangHeader = (lat: number, lng: number, pincode = ""): string =>
  panchangClockTimeZone(lat, lng, pincode);
