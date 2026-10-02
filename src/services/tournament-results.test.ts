import { describe, expect, it } from "vitest";

import { buildTournamentLeaders, buildTournamentStandings, getTournamentPlacements } from "./tournament-results";

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

describe("tournament carousel leaders", () => {
  const entrants = [...competitors, { id: "e", name: "Em", seed: 5 }].map((competitor) => ({
    ...competitor, players: [{ id: `player-${competitor.id}`, name: competitor.name, avatarUrl: `/${competitor.id}.jpg` }],
  }));
  const semiFinals = [
    { round: 1, homeCompetitorId: "a", awayCompetitorId: "b", matchStatus: "FINISHED" as const, homeScore: 2, awayScore: 0 },
    { round: 1, homeCompetitorId: "c", awayCompetitorId: "d", matchStatus: "FINISHED" as const, homeScore: 1, awayScore: 3 },
  ];

  it("limits league highlights to four ranked entrants and includes their points and avatars", () => {
    const result = buildTournamentLeaders({ type: "LEAGUE", status: "ACTIVE", competitors: entrants, fixtures: [semiFinals[0]] });
    expect(result.label).toBe("Top giải · Tạm thời");
    expect(result.entries).toHaveLength(4);
    expect(result.entries[0]).toMatchObject({ id: "a", rank: 1, points: 3, players: entrants[0].players });
    expect(result.entries.map((entry) => entry.rank)).toEqual([1, 2, 3, 4]);
  });

  it("retains both members of a ranked doubles competitor", () => {
    const doubles = entrants.map((entrant) => ({ ...entrant, players: [...entrant.players, { id: `mate-${entrant.id}`, name: "Đồng đội", avatarUrl: null }] }));
    const result = buildTournamentLeaders({ type: "LEAGUE", status: "FINISHED", competitors: doubles, fixtures: [semiFinals[0]] });
    expect(result.label).toBe("Top giải · Chung cuộc");
    expect(result.entries[0].players).toEqual(doubles[0].players);
  });

  it("does not fabricate standings before results exist, including a playing match", () => {
    const result = buildTournamentLeaders({ type: "LEAGUE", status: "ACTIVE", competitors: [...entrants].reverse(), fixtures: [{ ...semiFinals[0], matchStatus: "PLAYING" }] });
    expect(result.entries.map((entry) => entry.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.entries.every((entry) => entry.rank === null && entry.points === null)).toBe(true);
  });

  it("shows only surviving knockout contenders without assigning final ranks", () => {
    const result = buildTournamentLeaders({ type: "KNOCKOUT", status: "ACTIVE", competitors: entrants.slice(0, 4), fixtures: semiFinals });
    expect(result.label).toBe("Đang tranh cúp");
    expect(result.entries.map((entry) => entry.id)).toEqual(["a", "d"]);
    expect(result.entries.every((entry) => entry.rank === null)).toBe(true);
  });

  it("shows champion, runner-up and both joint third-place entrants for a finished knockout", () => {
    const result = buildTournamentLeaders({ type: "KNOCKOUT", status: "FINISHED", competitors: entrants.slice(0, 4), fixtures: [
      ...semiFinals, { round: 2, homeCompetitorId: "a", awayCompetitorId: "d", matchStatus: "FINISHED", homeScore: 2, awayScore: 4 },
    ] });
    expect(result.entries.map((entry) => [entry.id, entry.rank])).toEqual([["d", 1], ["a", 2], ["b", 3], ["c", 3]]);
  });

  it("does not show an invalid or cancelled tournament as having a champion", () => {
    expect(buildTournamentLeaders({ type: "KNOCKOUT", status: "FINISHED", competitors: entrants.slice(0, 4), fixtures: semiFinals }).entries).toEqual([]);
    expect(buildTournamentLeaders({ type: "LEAGUE", status: "CANCELLED", competitors: entrants, fixtures: [] }).entries).toEqual([]);
  });
});
