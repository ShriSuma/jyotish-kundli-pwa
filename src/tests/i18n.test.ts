import { describe, expect, it } from "vitest";
import en from "../i18n/locales/en.json";
import hi from "../i18n/locales/hi.json";
import kn from "../i18n/locales/kn.json";
import te from "../i18n/locales/te.json";
import ta from "../i18n/locales/ta.json";

const flatten = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null ? flatten(value as Record<string, unknown>, path) : [path];
  });

describe("i18n integrity", () => {
  it("all languages have same key structure", () => {
    const base = flatten(en as unknown as Record<string, unknown>).sort();
    [hi, kn, te, ta].forEach((lang) => {
      expect(flatten(lang as unknown as Record<string, unknown>).sort()).toEqual(base);
    });
  });

  it("no missing translations by key count", () => {
    const count = flatten(en as unknown as Record<string, unknown>).length;
    expect(flatten(hi as unknown as Record<string, unknown>).length).toBe(count);
    expect(flatten(kn as unknown as Record<string, unknown>).length).toBe(count);
    expect(flatten(te as unknown as Record<string, unknown>).length).toBe(count);
    expect(flatten(ta as unknown as Record<string, unknown>).length).toBe(count);
  });
});

