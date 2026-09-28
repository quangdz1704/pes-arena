import { describe, expect, it } from "vitest";

import { generateKnockoutRound, getKnockoutBracketSeedOrder, getKnockoutRoundLabel } from "./knockout";

describe("knockout", () => {
  it("pairs competitors in their seed order", () => {
    expect(generateKnockoutRound(["A", "B", "C", "D"])).toEqual([
      { round: 1, home: "A", away: "B" },
      { round: 1, home: "C", away: "D" },
    ]);
  });

  it("places top seeds in separate knockout branches", () => {
    expect(getKnockoutBracketSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(getKnockoutBracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("rejects an incomplete bracket", () => {
    expect(() => generateKnockoutRound(["A", "B", "C"])).toThrow();
  });

  it("names final rounds for the bracket", () => {
    expect(getKnockoutRoundLabel(1, 3)).toBe("Tứ kết");
    expect(getKnockoutRoundLabel(2, 3)).toBe("Bán kết");
    expect(getKnockoutRoundLabel(3, 3)).toBe("Chung kết");
  });
});
