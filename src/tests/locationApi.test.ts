import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../db/indexedDb";
import { fetchDistricts, fetchStates, fetchVillages, getCoordinates } from "../services/locationApi";

describe("locationApi", () => {
  beforeEach(async () => {
    await db.geocodeCache.clear();
  });

  it("fetchStates returns 28+ entries", async () => {
    const states = await fetchStates();
    expect(states.length).toBeGreaterThanOrEqual(28);
  });

  it("fetchDistricts for MH includes Mumbai and Pune", async () => {
    const districts = await fetchDistricts("MH");
    const names = districts.map((district) => district.name);
    expect(names).toContain("Mumbai");
    expect(names).toContain("Pune");
  });

  it("API failure falls back to static village data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const villages = await fetchVillages("MH-PUN", "411005");
    expect(villages.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("Nominatim response cached in IndexedDB", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ lat: "18.5204", lon: "73.8567" }]
    }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await getCoordinates("Pune");
    const second = await getCoordinates("Pune");
    expect(first.lat).toBe(18.5204);
    expect(second.lng).toBe(73.8567);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

