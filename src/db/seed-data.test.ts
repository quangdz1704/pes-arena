import { describe, expect, it } from "vitest";

import {
  midClubSeeds,
  nationalTeamSeeds,
  teamSeeds,
  topClubSeeds,
} from "./seed-data";

describe("team seed data", () => {
  it("meets the required pool sizes", () => {
    expect(topClubSeeds.length).toBeGreaterThanOrEqual(30);
    expect(midClubSeeds.length).toBeGreaterThanOrEqual(20);
    expect(nationalTeamSeeds.length).toBeGreaterThanOrEqual(20);
  });

  it("contains unique names and valid ratings", () => {
    expect(new Set(teamSeeds.map((team) => team.name)).size).toBe(teamSeeds.length);
    expect(teamSeeds.every((team) => team.rating >= 1 && team.rating <= 100)).toBe(
      true,
    );
  });

  it("keeps club and national pool types consistent", () => {
    expect([...topClubSeeds, ...midClubSeeds].every((team) => team.type === "CLUB"))
      .toBe(true);
    expect(nationalTeamSeeds.every((team) => team.type === "NATIONAL")).toBe(true);
  });
});
