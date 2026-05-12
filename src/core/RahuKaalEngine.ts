import type { RahuKaalOutput } from "./AstroTypes";
import { weekdayInTimeZone } from "./placeTime";

const segmentByDay: Record<number, number> = {
  0: 8,
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3
};

export type RahuKaalCalcOptions = {
  locale?: string;
  /** Weekday + clock labels use this zone when set (e.g. Asia/Kolkata for Indian places). */
  clockTimeZone?: string;
};

export const calculateRahuKaal = (
  date: Date,
  sunrise: Date,
  sunset: Date,
  opts?: RahuKaalCalcOptions
): RahuKaalOutput => {
  const locale = opts?.locale ?? "en-IN";
  const clockTz = opts?.clockTimeZone;
  const fmt = (d: Date): string =>
    d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...(clockTz ? { timeZone: clockTz } : {})
    });

  const day = clockTz ? weekdayInTimeZone(date, clockTz) : date.getDay();
  const seg = segmentByDay[day] ?? 8;
  const daylightMs = sunset.getTime() - sunrise.getTime();
  const segmentMs = daylightMs / 8;
  const start = new Date(sunrise.getTime() + segmentMs * (seg - 1));
  const end = new Date(start.getTime() + segmentMs);
  const now = date.getTime();
  return {
    startTime: fmt(start),
    endTime: fmt(end),
    isActive: now >= start.getTime() && now <= end.getTime()
  };
};

