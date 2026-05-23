import { describe, expect, it } from "vitest";
import { ghatiVighatiSinceSunrise } from "../core/ghatiVighati";

describe("ghatiVighatiSinceSunrise", () => {
  it("maps elapsed time to ghaṭī and vighaṭī (24 min / 24 sec)", () => {
    const sunrise = new Date("1993-05-31T00:31:00.000Z"); // 06:01 IST
    const birth = new Date("1993-05-31T03:55:00.000Z"); // 09:25 IST — 3h 24m after sunrise
    const gv = ghatiVighatiSinceSunrise(birth, sunrise);
    expect(gv).toEqual({ ghati: 8, vighati: 30 });
  });

  it("returns zero before sunrise", () => {
    const sunrise = new Date("1993-05-31T00:31:00.000Z");
    const birth = new Date("1993-05-30T23:00:00.000Z");
    expect(ghatiVighatiSinceSunrise(birth, sunrise)).toEqual({ ghati: 0, vighati: 0 });
  });
});
