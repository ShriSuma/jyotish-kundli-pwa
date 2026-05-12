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
