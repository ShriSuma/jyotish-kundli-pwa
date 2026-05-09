import type { RahuKaalOutput } from "./AstroTypes";

const segmentByDay: Record<number, number> = {
  0: 8,
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3
};

const fmt = (date: Date): string => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const calculateRahuKaal = (date: Date, sunrise: Date, sunset: Date): RahuKaalOutput => {
  const day = date.getDay();
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

