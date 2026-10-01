import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/tournament.repository", () => ({
  cancelTournamentRecord: vi.fn(),
  createKnockoutRecord: vi.fn(),
  createLeagueRecord: vi.fn(),
  getTournamentFixtureForMatchStart: vi.fn(),
  getTournamentRecord: vi.fn(),
  listTournamentRecords: vi.fn(),
}));
vi.mock("@/repositories/match.repository", () => ({
  getMatchSetupRecords: vi.fn(),
  listLeaderboardMatchRows: vi.fn(),
}));

import { getMatchSetupRecords, listLeaderboardMatchRows } from "@/repositories/match.repository";
import { createKnockoutRecord, createLeagueRecord } from "@/repositories/tournament.repository";

import { createKnockout, createKnockoutSchema, createLeague, createLeagueSchema } from "./tournament.service";
import { buildTournamentTeamPlan } from "./tournament-team-plan";

const uuid = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const input = { name: "League giao hữu", matchMode: "ONE_V_ONE" as const, competitors: [[uuid(1)], [uuid(2)]] };

describe("optional tournament teams", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates a league without fixed teams or a team pool", async () => {
    await createLeague(createLeagueSchema.parse(input));

    expect(createLeagueRecord).toHaveBeenCalledWith(expect.objectContaining({
      competitorPlayerIds: input.competitors, teamPoolId: null, teamIds: [], isHomeAndAway: true,
    }));
    expect(getMatchSetupRecords).not.toHaveBeenCalled();
  });

  it("creates a knockout without assigning undefined teams during seeding", async () => {
    vi.mocked(listLeaderboardMatchRows).mockResolvedValue([]);
    await createKnockout(createKnockoutSchema.parse(input));

    expect(createKnockoutRecord).toHaveBeenCalledWith(expect.objectContaining({
      teamPoolId: null, teamIds: [], isHomeAndAway: false,
    }));
  });

  it("requires complete and unique assignments when fixed teams are supplied", () => {
    expect(createLeagueSchema.safeParse({ ...input, teamPoolId: uuid(10), teamIds: [] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...input, teamPoolId: uuid(10), teamIds: [uuid(11)] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...input, teamPoolId: uuid(10), teamIds: [uuid(11), uuid(11)] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...input, teamIds: [uuid(11), uuid(12)] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...input, teamPoolId: uuid(10), teamIds: [uuid(11), uuid(12)] }).success).toBe(true);
  });

  it("checks fixed teams against the selected pool before creating the league", async () => {
    vi.mocked(getMatchSetupRecords).mockResolvedValue({ players: [], pools: [], recentTeamIds: [] });

    await expect(createLeague(createLeagueSchema.parse({ ...input, teamPoolId: uuid(10), teamIds: [uuid(11), uuid(12)] }))).rejects.toThrow("Đội bóng phải thuộc nhóm đội");
    expect(createLeagueRecord).not.toHaveBeenCalled();
  });

  const perMatchInput = (type: "LEAGUE" | "KNOCKOUT" = "LEAGUE", competitors = input.competitors) => ({
    ...input, competitors, teamPoolId: uuid(10), teamAssignmentScope: "PER_MATCH" as const,
    fixtureTeams: buildTournamentTeamPlan(type, competitors.length, true).map(({ round, position }) => ({ round, position, homeTeamId: uuid(11), awayTeamId: uuid(12) })),
  });

  it("accepts separate teams for both legs and allows reuse across fixtures", async () => {
    vi.mocked(getMatchSetupRecords).mockResolvedValue({ players: [], recentTeamIds: [], pools: [{ id: uuid(10), teams: [{ id: uuid(11) }, { id: uuid(12) }] }] } as unknown as Awaited<ReturnType<typeof getMatchSetupRecords>>);
    const parsed = createLeagueSchema.parse(perMatchInput());
    await createLeague(parsed);
    expect(createLeagueRecord).toHaveBeenCalledWith(expect.objectContaining({ teamIds: [], fixtureTeams: parsed.fixtureTeams }));
  });

  it("rejects incomplete, duplicated or non-existent fixture slots", () => {
    const valid = perMatchInput();
    expect(createLeagueSchema.safeParse({ ...valid, fixtureTeams: valid.fixtureTeams.slice(1) }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...valid, fixtureTeams: [valid.fixtureTeams[0], valid.fixtureTeams[0]] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...valid, fixtureTeams: valid.fixtureTeams.map((fixture) => ({ ...fixture, round: fixture.round + 5 })) }).success).toBe(false);
  });

  it("rejects mirrored teams, a missing pool, and mixed assignment modes", () => {
    const valid = perMatchInput();
    expect(createLeagueSchema.safeParse({ ...valid, fixtureTeams: valid.fixtureTeams.map((fixture) => ({ ...fixture, awayTeamId: fixture.homeTeamId })) }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...valid, teamPoolId: null }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...valid, teamIds: [uuid(11), uuid(12)] }).success).toBe(false);
    expect(createLeagueSchema.safeParse({ ...valid, teamAssignmentScope: "FIXED" }).success).toBe(false);
  });

  it("requires assignments for future knockout rounds and preserves them during seeding", async () => {
    const valid = perMatchInput("KNOCKOUT", [...input.competitors, [uuid(3)], [uuid(4)]]);
    expect(valid.fixtureTeams).toHaveLength(3);
    expect(createKnockoutSchema.safeParse({ ...valid, fixtureTeams: valid.fixtureTeams.slice(0, 2) }).success).toBe(false);
    vi.mocked(listLeaderboardMatchRows).mockResolvedValue([]);
    vi.mocked(getMatchSetupRecords).mockResolvedValue({ players: [], recentTeamIds: [], pools: [{ id: uuid(10), teams: [{ id: uuid(11) }, { id: uuid(12) }] }] } as unknown as Awaited<ReturnType<typeof getMatchSetupRecords>>);
    await createKnockout(createKnockoutSchema.parse(valid));
    expect(createKnockoutRecord).toHaveBeenCalledWith(expect.objectContaining({ teamIds: [], fixtureTeams: valid.fixtureTeams }));
  });

  it("checks per-match teams against the pool before writing any records", async () => {
    vi.mocked(getMatchSetupRecords).mockResolvedValue({ players: [], pools: [], recentTeamIds: [] });
    await expect(createLeague(createLeagueSchema.parse(perMatchInput()))).rejects.toThrow("Đội bóng phải thuộc nhóm đội");
    expect(createLeagueRecord).not.toHaveBeenCalled();
  });
});
