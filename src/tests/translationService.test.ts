import { describe, expect, it, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { initDatabase } from "../db/indexedDb";
import { protectPlaceholders, restorePlaceholders } from "../services/translationPlaceholders";
import { predictionNeedsLocalization } from "../services/localizeContent";
import type { PredictionOutput } from "../core/AstroTypes";

describe("translationPlaceholders", () => {
  it("preserves i18n tokens through protect/restore", () => {
    const src = "Hello {{name}}, your {{moonRashi}} sign.";
    const { text, tokens } = protectPlaceholders(src);
    expect(text).not.toContain("{{");
    expect(tokens).toEqual(["name", "moonRashi"]);
    expect(restorePlaceholders(text.replace("Hello", "ನಮಸ್ಕಾರ"), tokens)).toBe(
      "ನಮಸ್ಕಾರ {{name}}, your {{moonRashi}} sign."
    );
  });
});

describe("predictionNeedsLocalization", () => {
  it("detects English API text for Indian UI language", () => {
    const p: PredictionOutput = {
      title: "High momentum day",
      summary: "Career focus is strong today.",
      career: "Work",
      finance: "Save",
      health: "Rest",
      relationships: "Talk",
      lucky: { color: "Green", number: 3, direction: "East" },
      rating: 4
    };
    expect(predictionNeedsLocalization(p, "kn")).toBe(true);
    expect(predictionNeedsLocalization(p, "en")).toBe(false);
  });
});

describe("translateTexts", () => {
  beforeEach(async () => {
    await initDatabase();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { texts: string[] };
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              translations: body.texts.map((t) => `[kn]${t}`)
            })
        };
      })
    );
  });

  it("returns original for English target", async () => {
    const { translateTexts } = await import("../services/translationService");
    const out = await translateTexts(["Hello world"], "en");
    expect(out).toEqual(["Hello world"]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls translate API for Kannada", async () => {
    const { translateTexts } = await import("../services/translationService");
    const out = await translateTexts(["Add your PIN code"], "kn");
    expect(out[0]).toContain("[kn]");
    expect(fetch).toHaveBeenCalled();
  });
});
