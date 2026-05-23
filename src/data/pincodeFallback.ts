import type { Village } from "../services/locationApi";

/**
 * Offline / API-fallback catalog for PINs used in patrikā tests and coastal Karnataka.
 * Used when India Post API is slow, blocked, or returns empty coordinates.
 */
export const PINCODE_FALLBACK: Village[] = [
  {
    name: "Gokarna",
    districtCode: "KA-UKN",
    stateCode: "KA",
    lat: 14.5479,
    lng: 74.3187,
    pincode: "581326"
  },
  {
    name: "Karwar",
    districtCode: "KA-UKN",
    stateCode: "KA",
    lat: 14.8137,
    lng: 74.1299,
    pincode: "581301"
  },
  {
    name: "Kumta",
    districtCode: "KA-UKN",
    stateCode: "KA",
    lat: 14.4289,
    lng: 74.4189,
    pincode: "581343"
  },
  {
    name: "Honnavar",
    districtCode: "KA-UKN",
    stateCode: "KA",
    lat: 14.2808,
    lng: 74.4439,
    pincode: "581334"
  },
  {
    name: "Sirsi",
    districtCode: "KA-UKN",
    stateCode: "KA",
    lat: 14.6204,
    lng: 74.8358,
    pincode: "581401"
  }
];

export const staticVillagesByPincode = (pincode: string): Village[] =>
  PINCODE_FALLBACK.filter((v) => v.pincode === pincode);
