import { describe, expect, it } from "vitest";
import { hinduSunriseSunsetFromAstronomical } from "../core/hinduSunTimes";

describe("hinduSunTimes", () => {
  it("delays sunrise and advances sunset vs astronomical (Gokarna May 1993)", () => {
    const astroSunrise = new Date("1993-05-31T00:31:26.000Z");
    const astroSunset = new Date("1993-05-31T13:29:14.000Z");
    const h = hinduSunriseSunsetFromAstronomical(astroSunrise, astroSunset, 14.55);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata"
      });
    expect(fmt(h.sunrise)).toMatch(/^06:0[3-5]$/);
    expect(fmt(h.sunset)).toMatch(/^18:5[4-7]$/);
  });
});
