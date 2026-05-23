import { isRoughIndiaRegion } from "./placeTime";

/**
 * Converts birth calendar wall clock at the birthplace to a UTC instant.
 * Indian births: wall clock is interpreted as Asia/Kolkata (IST), matching common desktop software.
 * Elsewhere: interpreted as UTC until a timezone picker is added.
 */
export const inferBirthTimezoneIana = (lat: number, lng: number): string =>
  isRoughIndiaRegion(lat, lng) ? "Asia/Kolkata" : "Etc/UTC";

/**
 * @param birthDate YYYY-MM-DD
 * @param birthTime HH:mm (24h)
 */
export const wallClockBirthToUtc = (
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number
): Date => {
  const tz = inferBirthTimezoneIana(lat, lng);
  if (tz === "Asia/Kolkata") {
    return new Date(`${birthDate}T${birthTime}:00+05:30`);
  }
  return new Date(`${birthDate}T${birthTime}:00Z`);
};

/** Calendar YYYY-MM-DD from a DatePicker value (browser local calendar day). */
export const formatPickerDateLocalYmd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** HH:mm from a time picker (browser local). */
export const formatPickerTimeLocalHm = (d: Date): string => {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

/** Build HH:mm from explicit hour/minute (avoids browser timezone shifting birth place clock). */
export const formatWallClockHm = (hour: number, minute: number): string =>
  `${String(Math.min(23, Math.max(0, hour))).padStart(2, "0")}:${String(Math.min(59, Math.max(0, minute))).padStart(2, "0")}`;

/** Parse HH:mm wall clock at birthplace (for dropdown time pickers). */
export const parseWallClockHm = (hm: string): { hour: number; minute: number } | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

/** Age in decimal years at `atUtc` from birth wall clock at birthplace. */
export const ageDecimalYearsAt = (
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  atUtc: Date
): number => {
  const birth = wallClockBirthToUtc(birthDate, birthTime, lat, lng);
  const ms = Math.max(0, atUtc.getTime() - birth.getTime());
  return ms / (365.2425 * 24 * 60 * 60 * 1000);
};
