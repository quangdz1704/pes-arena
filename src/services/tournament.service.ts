import "server-only";
import { z } from "zod";
import { cancelTournamentRecord, createKnockoutRecord, createLeagueRecord, getTournamentFixtureForMatchStart, getTournamentRecord, listTournamentHighlightRecords, listTournamentRecords } from "@/repositories/tournament.repository";
import { getMatchSetupRecords, listLeaderboardMatchRows } from "@/repositories/match.repository";
import { arenaRating, buildLeaderboard } from "./leaderboard";
import { buildTournamentTeamPlan } from "./tournament-team-plan";

const tournamentSchema = z.object({
  name: z.string().trim().min(3).max(150),
  matchMode: z.enum(["ONE_V_ONE", "TWO_V_TWO"]),
  competitors: z.array(z.array(z.uuid()).min(1).max(2)).min(2).max(8),
  teamPoolId: z.uuid().nullable().default(null),
  teamIds: z.array(z.uuid()).max(8).default([]),
  teamAssignmentScope: z.enum(["FIXED", "PER_MATCH"]).default("FIXED"),
  fixtureTeams: z.array(z.object({
    round: z.number().int().min(1).max(14),
    position: z.number().int().min(1).max(4),
    homeTeamId: z.uuid(),
    awayTeamId: z.uuid(),
  })).max(56).default([]),
  isHomeAndAway: z.boolean().default(true),
});
function validateTournamentTeams(value: z.infer<typeof tournamentSchema>, context: z.RefinementCtx, type: "LEAGUE" | "KNOCKOUT") {
  const playersPerCompetitor = value.matchMode === "ONE_V_ONE" ? 1 : 2;
  if (!value.competitors.every((competitor) => competitor.length === playersPerCompetitor)) {
    context.addIssue({ code: "custom", path: ["competitors"], message: value.matchMode === "ONE_V_ONE" ? "Mỗi đối thủ 1v1 chỉ có một người." : "Mỗi cặp 2v2 cần đúng hai người." });
  }
  const playerIds = value.competitors.flat();
  if (new Set(playerIds).size !== playerIds.length) {
    context.addIssue({ code: "custom", path: ["competitors"], message: "Một người chỉ được thuộc một đối thủ trong giải." });
  }
  if (value.teamAssignmentScope === "FIXED" && (value.teamPoolId || value.teamIds.length > 0) && value.teamIds.length !== value.competitors.length) {
    context.addIssue({ code: "custom", path: ["teamIds"], message: "Mỗi đối thủ cần được gán một đội bóng." });
  }
  if ((value.teamIds.length > 0 || value.fixtureTeams.length > 0) && !value.teamPoolId) {
    context.addIssue({ code: "custom", path: ["teamPoolId"], message: "Chọn nhóm đội để gán đội cho giải." });
  }
  if (new Set(value.teamIds).size !== value.teamIds.length) {
    context.addIssue({ code: "custom", path: ["teamIds"], message: "Một đội bóng chỉ thuộc về một đối thủ trong giải." });
  }
  if ((value.teamAssignmentScope === "FIXED" && value.fixtureTeams.length > 0) || (value.teamAssignmentScope === "PER_MATCH" && value.teamIds.length > 0)) {
    context.addIssue({ code: "custom", path: ["teamAssignmentScope"], message: "Chỉ chọn một cách gán đội: cố định hoặc theo từng trận." });
  }
  if (value.teamAssignmentScope === "PER_MATCH" && value.teamPoolId) {
    const plan = buildTournamentTeamPlan(type, value.competitors.length, value.isHomeAndAway);
    const keys = new Set(value.fixtureTeams.map((fixture) => `${fixture.round}:${fixture.position}`));
    if (value.fixtureTeams.length !== plan.length || keys.size !== plan.length || !plan.every((fixture) => keys.has(`${fixture.round}:${fixture.position}`))) {
      context.addIssue({ code: "custom", path: ["fixtureTeams"], message: "Cần gán đủ đội cho từng trận trong lịch, bao gồm các vòng knockout tiếp theo." });
    }
    if (value.fixtureTeams.some((fixture) => fixture.homeTeamId === fixture.awayTeamId)) {
      context.addIssue({ code: "custom", path: ["fixtureTeams"], message: "Hai bên trong một trận phải dùng hai đội bóng khác nhau." });
    }
  }
}
export const createLeagueSchema = tournamentSchema.superRefine((value, context) => validateTournamentTeams(value, context, "LEAGUE"));
export async function createLeague(input: z.infer<typeof createLeagueSchema>) {
  if (input.teamPoolId) await assertTournamentTeams(input.teamPoolId, [...input.teamIds, ...input.fixtureTeams.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId])]);
  return createLeagueRecord({ name: input.name, matchMode: input.matchMode, competitorPlayerIds: input.competitors, teamPoolId: input.teamPoolId, teamIds: input.teamIds, fixtureTeams: input.fixtureTeams, isHomeAndAway: input.isHomeAndAway });
}
export const createKnockoutSchema = tournamentSchema.superRefine((value, context) => validateTournamentTeams(value, context, "KNOCKOUT")).refine(
  (value) => Number.isInteger(Math.log2(value.competitors.length)),
  { path: ["competitors"], message: "Knockout cần 2, 4 hoặc 8 đối thủ." },
);
export async function createKnockout(input: z.infer<typeof createKnockoutSchema>) {
  if (input.teamPoolId) await assertTournamentTeams(input.teamPoolId, [...input.teamIds, ...input.fixtureTeams.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId])]);
  const rows = await listLeaderboardMatchRows({ matchMode: "ALL", startDate: null });
  const ratings = new Map(buildLeaderboard(rows, "RATING").map((entry) => [entry.playerId, entry.rating]));
  const seededCompetitors = [...input.competitors].sort((left, right) => {
    const averageRating = (competitor: string[]) => competitor.reduce((total, playerId) => total + (ratings.get(playerId) ?? arenaRating.initial), 0) / competitor.length;
    return averageRating(right) - averageRating(left);
  });
  const teamIdByPlayers = new Map(input.competitors.map((competitor, index) => [competitor.join(","), input.teamIds[index]]));
  return createKnockoutRecord({ name: input.name, matchMode: input.matchMode, competitorPlayerIds: seededCompetitors, teamPoolId: input.teamPoolId, teamIds: input.teamIds.length ? seededCompetitors.map((competitor) => teamIdByPlayers.get(competitor.join(","))!) : [], fixtureTeams: input.fixtureTeams, isHomeAndAway: false });
}

async function assertTournamentTeams(teamPoolId: string, teamIds: string[]) {
  const pool = (await getMatchSetupRecords()).pools.find((item) => item.id === teamPoolId);
  if (!pool || !teamIds.every((teamId) => pool.teams.some((team) => team.id === teamId))) {
    throw new Error("Đội bóng phải thuộc nhóm đội đang hoạt động đã chọn.");
  }
}
export async function listTournaments() { return listTournamentRecords(); }
export async function listTournamentHighlights() { return listTournamentHighlightRecords(); }
export async function getTournament(tournamentId: string) {
  if (!z.uuid().safeParse(tournamentId).success) return null;
  return getTournamentRecord(tournamentId);
}
export async function getTournamentFixtureForStart(fixtureId: string) {
  if (!z.uuid().safeParse(fixtureId).success) return null;
  return getTournamentFixtureForMatchStart(fixtureId);
}
export async function cancelTournament(tournamentId: string) {
  return cancelTournamentRecord(z.uuid().parse(tournamentId));
}
