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
});
