import "server-only";
import { z } from "zod";
import { createLeagueRecord, getTournamentFixtureForMatchStart, getTournamentRecord, listTournamentRecords } from "@/repositories/tournament.repository";

export const createLeagueSchema = z.object({ name: z.string().trim().min(3).max(150), playerIds: z.array(z.uuid()).min(2).max(16) }).refine((value) => new Set(value.playerIds).size === value.playerIds.length, "Người chơi không được trùng.");
export async function createLeague(input: z.infer<typeof createLeagueSchema>) { return createLeagueRecord(input); }
export async function listTournaments() { return listTournamentRecords(); }
export async function getTournament(tournamentId: string) {
  if (!z.uuid().safeParse(tournamentId).success) return null;
  return getTournamentRecord(tournamentId);
}
export async function getTournamentFixtureForStart(fixtureId: string) {
  if (!z.uuid().safeParse(fixtureId).success) return null;
  return getTournamentFixtureForMatchStart(fixtureId);
}
