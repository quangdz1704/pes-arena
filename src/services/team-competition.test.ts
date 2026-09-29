import { describe, expect, it } from "vitest";

import { getTeamCompetition, listTeamCompetitions } from "./team-competition";

describe("team competitions", () => {
  it("maps clubs to the familiar league name and keeps national teams separate", () => {
    expect(getTeamCompetition({ type: "CLUB", country: "England" })).toBe("Ngoại hạng Anh");
    expect(getTeamCompetition({ type: "CLUB", country: "Italy" })).toBe("Serie A");
    expect(getTeamCompetition({ type: "NATIONAL", country: "England" })).toBe("Đội tuyển quốc gia");
  });

  it("returns each available competition once", () => {
    expect(listTeamCompetitions([
      { type: "CLUB" as const, country: "Italy" },
      { type: "CLUB" as const, country: "England" },
      { type: "CLUB" as const, country: "Italy" },
    ])).toEqual(["Ngoại hạng Anh", "Serie A"]);
  });
});
