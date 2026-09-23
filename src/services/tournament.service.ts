import "server-only";
import { z } from "zod";
import { createLeagueRecord, listTournamentRecords } from "@/repositories/tournament.repository";

export const createLeagueSchema = z.object({ name: z.string().trim().min(3).max(150), playerIds: z.array(z.uuid()).min(2).max(16) }).refine((value) => new Set(value.playerIds).size === value.playerIds.length, "Người chơi không được trùng.");
export async function createLeague(input: z.infer<typeof createLeagueSchema>) { return createLeagueRecord(input); }
export async function listTournaments() { return listTournamentRecords(); }
