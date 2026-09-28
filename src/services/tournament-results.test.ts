import { describe, expect, it } from "vitest";

import { buildTournamentStandings, getTournamentPlacements } from "./tournament-results";

const competitors = [
  { id: "a", name: "An", seed: 1 },
  { id: "b", name: "Bình", seed: 2 },
  { id: "c", name: "Chi", seed: 3 },
  { id: "d", name: "Dung", seed: 4 },
];

describe("tournament results", () => {
  it("ranks a league by points, goal difference and goals scored", () => {
    const standings = buildTournamentStandings(competitors, [
      { round: 1, homeCompetitorId: "a", awayCompetitorId: "b", matchStatus: "FINISHED", homeScore: 3, awayScore: 1 },
      { round: 1, homeCompetitorId: "c", awayCompetitorId: "d", matchStatus: "FINISHED", homeScore: 2, awayScore: 1 },
    ]);

    expect(standings.map((standing) => standing.id)).toEqual(["a", "c", "d", "b"]);
    expect(standings[0]).toMatchObject({ points: 3, rank: 1, goalsFor: 3 });
  });

  it("awards knockout champion, runner-up and joint third place after the final", () => {
    const placements = getTournamentPlacements({
      type: "KNOCKOUT",
      status: "FINISHED",
      competitors,
      fixtures: [
        { round: 1, homeCompetitorId: "a", awayCompetitorId: "b", matchStatus: "FINISHED", homeScore: 2, awayScore: 0 },
        { round: 1, homeCompetitorId: "c", awayCompetitorId: "d", matchStatus: "FINISHED", homeScore: 1, awayScore: 3 },
        { round: 2, homeCompetitorId: "a", awayCompetitorId: "d", matchStatus: "FINISHED", homeScore: 4, awayScore: 2 },
      ],
    });

    expect(placements).toEqual([
      { competitorId: "a", place: 1 },
      { competitorId: "d", place: 2 },
      { competitorId: "b", place: 3 },
      { competitorId: "c", place: 3 },
    ]);
  });
});
