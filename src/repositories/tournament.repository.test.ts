import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: vi.fn() }));

import { getDb } from "@/db";
import { tournamentCompetitors, tournamentFixtureTeams, tournamentFixtures } from "@/db/schema";
import { advanceKnockoutTournament, createLeagueRecord, getTournamentFixtureForMatchStart, getTournamentRecord, listTournamentHighlightRecords } from "./tournament.repository";

// Exercise repository query mapping without connecting to the user's database.
function query(rows: unknown[]) {
  const result = Promise.resolve(rows);
  return Object.assign(result, {
    from: () => result, where: () => result, innerJoin: () => result, orderBy: () => result,
  });
}

function mockDb(selectRows: unknown[][] = []) {
  const writes: { table: unknown; values: unknown }[] = [];
  const db = {
    select: vi.fn(() => query(selectRows.shift() ?? [])),
    insert: vi.fn((table: unknown) => ({ values: (values: unknown) => {
      writes.push({ table, values });
      return { onConflictDoNothing: vi.fn(), table, values };
    } })),
    batch: vi.fn().mockResolvedValue([]),
  };
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  return { writes, db };
}

describe("tournament team persistence", () => {
  beforeEach(() => vi.resetAllMocks());

  it("stores fixture teams separately from competitor teams in the creation batch", async () => {
    const { writes, db } = mockDb();
    const fixtureTeams = [
      { round: 1, position: 1, homeTeamId: "a", awayTeamId: "b" },
      { round: 2, position: 1, homeTeamId: "c", awayTeamId: "d" },
    ];
    const tournamentId = await createLeagueRecord({ name: "League", matchMode: "ONE_V_ONE", competitorPlayerIds: [["p1"], ["p2"]], teamPoolId: "pool", teamIds: [], fixtureTeams, isHomeAndAway: true });
    expect(writes.find((write) => write.table === tournamentFixtureTeams)?.values).toEqual(fixtureTeams.map((fixture) => ({ ...fixture, tournamentId })));
    expect(writes.find((write) => write.table === tournamentFixtures)?.values).toEqual([
      expect.objectContaining({ round: 1, position: 1 }), expect.objectContaining({ round: 2, position: 1 }),
    ]);
    expect(writes.find((write) => write.table === tournamentCompetitors)?.values).toEqual([expect.objectContaining({ teamId: null }), expect.objectContaining({ teamId: null })]);
    expect(db.batch).toHaveBeenCalledOnce();
    expect(db.batch.mock.calls[0]![0]).toHaveLength(5);
  });

  it.each([true, false])("starts the fixture with per-match teams when present (%s), otherwise fixed teams", async (perMatch) => {
    mockDb([
      [{ id: "fixture", tournamentId: "tournament", round: 2, position: 1, homeCompetitorId: "h", awayCompetitorId: "a", matchId: null }],
      [{ matchMode: "ONE_V_ONE", status: "ACTIVE", teamPoolId: "pool" }],
      [{ competitorId: "h", playerId: "p1", name: "Home" }, { competitorId: "a", playerId: "p2", name: "Away" }],
      [{ id: "h", teamId: "fixed-home" }, { id: "a", teamId: "fixed-away" }],
      perMatch ? [{ homeTeamId: "match-home", awayTeamId: "match-away" }] : [],
    ]);
    expect(await getTournamentFixtureForMatchStart("fixture")).toEqual(expect.objectContaining({
      teamPoolId: "pool", homeTeamId: perMatch ? "match-home" : "fixed-home", awayTeamId: perMatch ? "match-away" : "fixed-away",
    }));
  });

  it("numbers advancing knockout slots so they resolve the reserved next-round teams", async () => {
    const { writes } = mockDb([
      [{ id: "tournament", status: "ACTIVE", type: "KNOCKOUT" }],
      [
        { round: 1, position: 1, matchId: "m1", homeCompetitorId: "h1", awayCompetitorId: "a1" },
        { round: 1, position: 2, matchId: "m2", homeCompetitorId: "h2", awayCompetitorId: "a2" },
      ],
      [{ id: "m1", status: "FINISHED" }, { id: "m2", status: "FINISHED" }],
      [{ matchId: "m1", side: "A", score: 2 }, { matchId: "m1", side: "B", score: 0 }, { matchId: "m2", side: "A", score: 0 }, { matchId: "m2", side: "B", score: 3 }],
    ]);
    await advanceKnockoutTournament("tournament");
    expect(writes.find((write) => write.table === tournamentFixtures)?.values).toEqual([{ tournamentId: "tournament", round: 2, position: 1, homeCompetitorId: "h1", awayCompetitorId: "a2" }]);
  });

  it("shows per-match team names on the schedule and reserves future knockout team names", async () => {
    mockDb([
      [{ id: "tournament", type: "KNOCKOUT" }],
      [{ id: "h", displayName: "Home", seed: 1, teamId: null }, { id: "a", displayName: "Away", seed: 2, teamId: null }],
      [{ round: 1, position: 1, homeTeamId: "t1", awayTeamId: "t2" }, { round: 2, position: 1, homeTeamId: "t2", awayTeamId: "t1" }],
      [{ competitorId: "h", playerId: "p1", name: "Home" }, { competitorId: "a", playerId: "p2", name: "Away" }],
      [{ id: "fixture", round: 1, position: 1, homeCompetitorId: "h", awayCompetitorId: "a", matchId: null }],
      [{ id: "t1", name: "Real Madrid" }, { id: "t2", name: "Barcelona" }],
    ]);
    const tournament = await getTournamentRecord("tournament");
    expect(tournament?.teamAssignmentScope).toBe("PER_MATCH");
    expect(tournament?.fixtures[0]).toEqual(expect.objectContaining({ homeTeamName: "Real Madrid", awayTeamName: "Barcelona" }));
    expect(tournament?.plannedFixtureTeams[1]).toEqual({ round: 2, position: 1, homeTeamName: "Barcelona", awayTeamName: "Real Madrid" });
  });

  it("loads carousel ranks, names and avatars in batched queries", async () => {
    const { db } = mockDb([
      [{ id: "tournament", type: "LEAGUE", status: "ACTIVE" }],
      [{ id: "home", tournamentId: "tournament", displayName: "Home", seed: 1 }, { id: "away", tournamentId: "tournament", displayName: "Away", seed: 2 }],
      [{ tournamentId: "tournament", round: 1, matchId: "match", homeCompetitorId: "home", awayCompetitorId: "away" }],
      [{ competitorId: "home", id: "p1", name: "Cường", avatarUrl: "/cuong.jpg" }, { competitorId: "away", id: "p2", name: "Quang", avatarUrl: null }],
      [{ id: "match", status: "FINISHED" }],
      [{ matchId: "match", side: "A", score: 0 }, { matchId: "match", side: "B", score: 2 }],
    ]);
    const [tournament] = await listTournamentHighlightRecords();
    expect(tournament.leaders.entries[0]).toMatchObject({ id: "away", name: "Quang", rank: 1, points: 3, players: [{ id: "p2", name: "Quang", avatarUrl: null }] });
    expect(tournament.leaders.entries[1].players[0].avatarUrl).toBe("/cuong.jpg");
    expect(db.select).toHaveBeenCalledTimes(6);
  });

  it("skips player and score queries when there are no tournaments", async () => {
    const { db } = mockDb([[], [], []]);
    expect(await listTournamentHighlightRecords()).toEqual([]);
    expect(db.select).toHaveBeenCalledTimes(3);
  });
});
