import { describe, expect, it } from "vitest";

import {
  pickBalancedTeams,
  pickPureTeams,
  shufflePairs,
} from "./match-randomization";

const teams = [
  { id: "real", tier: "S" as const, rating: 91 },
  { id: "barca", tier: "S" as const, rating: 90 },
  { id: "arsenal", tier: "A" as const, rating: 87 },
  { id: "everton", tier: "C" as const, rating: 74 },
];

describe("match randomization", () => {
  it("never selects the same football team twice", () => {
    const [first, second] = pickPureTeams(teams, () => 0);

    expect(first.id).not.toBe(second.id);
  });

  it("prefers a team in the same tier with the closest rating", () => {
    const [first, second] = pickBalancedTeams(teams, () => 0);

    expect(first.tier).toBe(second.tier);
    expect(Math.abs(first.rating - second.rating)).toBe(1);
  });

  it("shuffles four players into a pairing different from the current one", () => {
    const current: [string[], string[]] = [["a", "b"], ["c", "d"]];
    const next = shufflePairs(["a", "b", "c", "d"], current, () => 0);

    expect(next).not.toEqual(current);
    expect(next.flat().sort()).toEqual(["a", "b", "c", "d"]);
  });
});
