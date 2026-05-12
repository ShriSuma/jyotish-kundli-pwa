import { getCoordinates } from "../services/locationApi";
import { isRoughIndiaRegion } from "./placeTime";

/**
 * Postalpincode.in often omits lat/lng (0,0). For an Indian PIN, fall back to Nominatim so Sun/API use real coordinates.
 */
export const resolvePanchangCoords = async (
  lat: number,
  lng: number,
  pincode: string,
  placeLabel: string
): Promise<{ lat: number; lng: number }> => {
  const pc = pincode.trim();
  const indianPin = /^[1-9]\d{5}$/.test(pc);
  const degenerate =
    !Number.isFinite(lat) || !Number.isFinite(lng) || (Math.abs(lat) < 1e-4 && Math.abs(lng) < 1e-4);
  const outsideIndia = !isRoughIndiaRegion(lat, lng);

  if (indianPin && (degenerate || outsideIndia)) {
    const short = placeLabel.replace(/\s*\(\d{6}\)\s*$/i, "").trim();
    try {
      if (short.length > 1) {
        return await getCoordinates(`${short}, ${pc}`);
      }
    } catch {
      /* try pin only */
    }
    try {
      return await getCoordinates(`${pc} India`);
    } catch {
      return { lat, lng };
    }
  }
  return { lat, lng };
};
