import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNarrativeSummary, fetchKundliNarrative, NarrativeApiError } from "../services/kundliNarrativeApi";
import { calculateKundli } from "../core/KundliEngine";

describe("kundliNarrativeApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildNarrativeSummary includes planet houses", () => {
    const k = calculateKundli({
      name: "N",
      birthDate: "1990-01-01",
      birthTime: "10:10",
      latitude: 19.076,
      longitude: 72.8777
    });
    const s = buildNarrativeSummary({ name: "N", birthDate: "1990-01-01", birthTime: "10:10" }, k, "en");
    expect(s.planets.length).toBe(k.planets.length);
    expect(s.moonPada).toBe(k.moonPada);
  });

  it("fetchKundliNarrative throws when URL missing", async () => {
    await expect(
      fetchKundliNarrative({
        lang: "en",
        birthDate: "x",
        birthTime: "y",
        lagnaSanskrit: "Mesha",
        moonSignSanskrit: "Mesha",
        moonPada: 1,
        sunSignSanskrit: "Mesha",
        planets: []
      })
    ).rejects.toThrow(NarrativeApiError);
  });
});
