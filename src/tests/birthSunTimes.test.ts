import { describe, expect, it } from "vitest";
import { sunTimesSyncForBirth, vedicWeekdayAtBirth } from "../core/birthSunTimes";

describe("birthSunTimes", () => {
  it("returns sunrise before sunset on birth civil day", () => {
    const birth = new Date("1993-05-31T09:25:00+05:30");
    const t = sunTimesSyncForBirth(birth, 14.5479, 74.3187, "581326");
    expect(t.sunrise.getTime()).toBeLessThan(t.sunset.getTime());
    expect(t.source).toBe("suncalc");
  });

  it("uses previous weekday when birth is before sunrise", () => {
    const birth = new Date("1993-05-31T05:00:00+05:30");
    const sun = sunTimesSyncForBirth(birth, 14.5479, 74.3187, "581326");
    const wdBefore = vedicWeekdayAtBirth(birth, sun.sunrise, 14.5479, 74.3187);
    const wdAfter = vedicWeekdayAtBirth(
      new Date("1993-05-31T10:00:00+05:30"),
      sun.sunrise,
      14.5479,
      74.3187
    );
    expect(wdBefore).not.toBe(wdAfter);
  });
});
