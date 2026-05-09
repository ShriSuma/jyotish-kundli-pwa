import { describe, expect, it } from "vitest";
import { getCellForRashiIndex, houseForSign } from "../components/kundli/southIndianLayout";

describe("southIndianLayout", () => {
  it("maps Mesha to top row second column", () => {
    expect(getCellForRashiIndex(0)).toEqual({ row: 0, col: 1 });
  });

  it("house 1 is lagna sign", () => {
    expect(houseForSign(3, 3)).toBe(1);
    expect(houseForSign(3, 4)).toBe(2);
  });
});
