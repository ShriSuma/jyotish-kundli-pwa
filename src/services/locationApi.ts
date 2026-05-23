import states from "../data/india-states.json";
import districts from "../data/india-districts.json";
import villages from "../data/india-villages.json";
import { cacheGeocode, getGeocode } from "../db/indexedDb";

export type State = {
  code: string;
  name: string;
};

export type District = {
  code: string;
  stateCode: string;
  name: string;
};

export type Village = {
  name: string;
  districtCode: string;
  /** Present when resolved from pincode or derived from district. */
  stateCode?: string;
  lat: number;
  lng: number;
  pincode: string;
};

const REQUEST_TIMEOUT_MS = 10000;
let lastNominatimCallMs = 0;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchStates = async (): Promise<State[]> => {
  return states as State[];
};

export const fetchDistricts = async (stateCode: string): Promise<District[]> => {
  return (districts as District[]).filter((district) => district.stateCode === stateCode);
};

const normTokens = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const tokenOverlapScore = (a: string, b: string): number => {
  const A = new Set(normTokens(a));
  const B = new Set(normTokens(b));
  let score = 0;
  for (const x of A) {
    if (B.has(x)) score += 1;
  }
  return score;
};

export const stateCodeFromPostalName = (postalStateName: string): string | undefined => {
  const t = postalStateName.trim().toLowerCase();
  for (const s of states as State[]) {
    if (s.name.toLowerCase() === t) return s.code;
  }
  return undefined;
};

/** Map India Post district label to our sparse district list for a state. */
export const findDistrictCodeForPostal = (stateCode: string, postalDistrict: string): string => {
  const dists = (districts as District[]).filter((d) => d.stateCode === stateCode);
  if (!dists.length) return "MH-MUM";

  const pd = postalDistrict.trim().toLowerCase();
  if (stateCode === "KA" && (pd.includes("bangalore") || pd.includes("bengaluru"))) {
    const blr = dists.find((d) => d.code === "KA-BLR");
    if (blr) return blr.code;
  }
  if (stateCode === "MH" && (pd.includes("mumbai") || pd.includes("thane") || pd.includes("navi mumbai"))) {
    const m = dists.find((d) => d.code === "MH-MUM" || d.name.toLowerCase().includes("mumbai"));
    if (m) return m.code;
  }

  let best = dists[0]!.code;
  let bestScore = 0;
  for (const d of dists) {
    const score = tokenOverlapScore(postalDistrict, d.name);
    if (score > bestScore) {
      bestScore = score;
      best = d.code;
    }
  }
  return best;
};

type PostalPincodeResponse = {
  Status: string;
  PostOffice?: Array<{
    Name: string;
    Pincode: string;
    District?: string;
    State?: string;
    Latitude?: string;
    Longitude?: string;
  }>;
};

/** When pincode is valid, returns post offices with state/district aligned to local catalog (or null). */
export const fetchVillagesByPincode = async (pincode: string): Promise<Village[] | null> => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const response = await withTimeout(fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`));
    if (!response.ok) throw new Error("Postal API request failed");
    const payload = (await response.json()) as PostalPincodeResponse[];
    const first = payload[0];
    if (first?.Status !== "Success" || !first.PostOffice?.length) return null;

    const out: Village[] = [];
    for (const po of first.PostOffice) {
      const stateName = po.State?.trim();
      if (!stateName) continue;
      const stateCode = stateCodeFromPostalName(stateName);
      if (!stateCode) continue;
      const districtLabel = po.District?.trim() || "";
      const districtCode = findDistrictCodeForPostal(stateCode, districtLabel);
      const lat = Number(po.Latitude);
      const lng = Number(po.Longitude);
      out.push({
        name: po.Name,
        districtCode,
        stateCode,
        lat: Number.isFinite(lat) && lat !== 0 ? lat : 0,
        lng: Number.isFinite(lng) && lng !== 0 ? lng : 0,
        pincode: po.Pincode || pincode
      });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
};

export const fetchVillages = async (districtCode: string, pincode?: string): Promise<Village[]> => {
  const stateFromDistrict = districtCode.split("-")[0] ?? "";
  const withState = (list: Village[]): Village[] =>
    list.map((v) => ({ ...v, stateCode: v.stateCode ?? stateFromDistrict }));

  const staticFallback = withState(
    (villages as Village[]).filter(
      (village) => village.districtCode === districtCode && (!pincode || village.pincode === pincode)
    )
  );

  if (pincode && /^\d{6}$/.test(pincode)) {
    const pinList = await fetchVillagesByPincode(pincode);
    if (pinList?.length) {
      const matched = pinList.filter((v) => v.districtCode === districtCode);
      const list = matched.length ? matched : pinList;
      return list.map((v) => {
        if (v.lat && v.lng) return v;
        const fb = staticFallback.find((s) => s.pincode === v.pincode && s.name === v.name) ?? staticFallback[0];
        return fb ? { ...v, lat: fb.lat, lng: fb.lng } : v;
      });
    }
  }

  if (!pincode) {
    return staticFallback;
  }

  try {
    const response = await withTimeout(fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`));
    if (!response.ok) {
      throw new Error("Postal API request failed");
    }

    const payload = (await response.json()) as PostalPincodeResponse[];
    const first = payload[0];
    if (first?.Status !== "Success" || !first.PostOffice?.length) {
      throw new Error("Postal API returned no records");
    }

    return first.PostOffice.map((postOffice) => ({
      name: postOffice.Name,
      districtCode,
      stateCode: stateFromDistrict,
      lat: Number(postOffice.Latitude) || staticFallback[0]?.lat || 19.076,
      lng: Number(postOffice.Longitude) || staticFallback[0]?.lng || 72.8777,
      pincode: postOffice.Pincode
    }));
  } catch {
    return staticFallback;
  }
};

export type ResolvedPinPlace = {
  villageName: string;
  districtCode: string;
  stateCode: string;
  lat: number;
  lng: number;
  pincode: string;
};

/** Resolve first post office for a PIN to coordinates (API lat/lng or Nominatim). */
export const resolvePlaceFromPincode = async (pincode: string): Promise<ResolvedPinPlace | null> => {
  if (!/^[1-9]\d{5}$/.test(pincode)) return null;
  const list = await fetchVillagesByPincode(pincode);
  if (!list?.length) return null;
  const v = list[0]!;
  const stateCode = v.stateCode ?? "";
  let lat = v.lat;
  let lng = v.lng;
  if (!lat || !lng) {
    const fb = (villages as Village[]).find((x) => x.pincode === pincode);
    if (fb) {
      lat = fb.lat;
      lng = fb.lng;
    }
  }
  try {
    const districtName =
      (districts as District[]).find((d) => d.code === v.districtCode)?.name ?? "";
    const query = `${v.name}, ${pincode}, ${districtName}, India`;
    const coords = await getCoordinates(query);
    lat = coords.lat;
    lng = coords.lng;
  } catch {
    if (!lat || !lng) return null;
  }
  return {
    villageName: v.name,
    districtCode: v.districtCode,
    stateCode,
    lat,
    lng,
    pincode
  };
};

export const getCoordinates = async (placeName: string): Promise<{ lat: number; lng: number }> => {
  const normalized = placeName.trim().toLowerCase();
  const cached = await getGeocode(normalized);
  if (cached) {
    return cached;
  }

  const now = Date.now();
  const elapsed = now - lastNominatimCallMs;
  if (elapsed < 1000) {
    await sleep(1000 - elapsed);
  }
  lastNominatimCallMs = Date.now();

  try {
    // Nominatim usage policy: max 1 req/s; identify app via User-Agent (https://operations.osmfoundation.org/policies/nominatim/)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)},India&format=json&limit=1`;
    const response = await withTimeout(
      fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "JyotishKundliPWA/1.0 (offline-first astrology; contact: local-app)"
        }
      })
    );
    if (!response.ok) {
      throw new Error("Unable to fetch coordinates right now");
    }
    const records = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!records.length) {
      throw new Error("Location not found");
    }
    const lat = Number(records[0].lat);
    const lng = Number(records[0].lon);
    await cacheGeocode(normalized, lat, lng);
    return { lat, lng };
  } catch {
    throw new Error("Unable to fetch location coordinates. Please try again.");
  }
};

