import "server-only";
import { z } from "zod";
import { cancelTournamentRecord, createLeagueRecord, getTournamentFixtureForMatchStart, getTournamentRecord, listTournamentRecords } from "@/repositories/tournament.repository";

export const createLeagueSchema = z.object({
  name: z.string().trim().min(3).max(150),
  matchMode: z.enum(["ONE_V_ONE", "TWO_V_TWO"]),
  competitors: z.array(z.array(z.uuid()).min(1).max(2)).min(2).max(8),
}).superRefine((value, context) => {
  const playersPerCompetitor = value.matchMode === "ONE_V_ONE" ? 1 : 2;
  if (!value.competitors.every((competitor) => competitor.length === playersPerCompetitor)) {
    context.addIssue({ code: "custom", path: ["competitors"], message: value.matchMode === "ONE_V_ONE" ? "Mỗi đối thủ 1v1 chỉ có một người." : "Mỗi cặp 2v2 cần đúng hai người." });
  }
  const playerIds = value.competitors.flat();
  if (new Set(playerIds).size !== playerIds.length) {
    context.addIssue({ code: "custom", path: ["competitors"], message: "Một người chỉ được thuộc một đối thủ trong giải." });
  }
});
export async function createLeague(input: z.infer<typeof createLeagueSchema>) {
  return createLeagueRecord({ name: input.name, matchMode: input.matchMode, competitorPlayerIds: input.competitors });
}
export async function listTournaments() { return listTournamentRecords(); }
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
