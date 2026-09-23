import "server-only";

import { asc } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { tournamentCompetitorPlayers, tournamentCompetitors, tournamentFixtures, tournaments } from "@/db/schema";

import { generateRoundRobin } from "@/services/round-robin";

export async function createLeagueRecord(input: { name: string; playerIds: string[] }) {
  const tournamentId = randomUUID();
  const competitors = input.playerIds.map((playerId) => ({ id: randomUUID(), playerId }));
  const fixtures = generateRoundRobin(competitors);
  await getDb().batch([
    getDb().insert(tournaments).values({ id: tournamentId, name: input.name, type: "LEAGUE", matchMode: "ONE_V_ONE", status: "ACTIVE" }),
    getDb().insert(tournamentCompetitors).values(competitors.map((competitor, index) => ({ id: competitor.id, tournamentId, displayName: `Competitor ${index + 1}`, seed: index + 1 }))),
    getDb().insert(tournamentCompetitorPlayers).values(competitors.map((competitor) => ({ competitorId: competitor.id, playerId: competitor.playerId, position: 1 }))),
    getDb().insert(tournamentFixtures).values(fixtures.map((fixture) => ({ tournamentId, round: fixture.round, homeCompetitorId: fixture.home.id, awayCompetitorId: fixture.away.id }))),
  ]);
  return tournamentId;
}

export async function listTournamentRecords() {
  const rows = await getDb().select().from(tournaments).orderBy(asc(tournaments.createdAt));
  const competitors = await getDb().select().from(tournamentCompetitors);
  const fixtureRows = await getDb().select().from(tournamentFixtures).orderBy(asc(tournamentFixtures.round));
  return rows.map((tournament) => ({ ...tournament, competitors: competitors.filter((item) => item.tournamentId === tournament.id), fixtures: fixtureRows.filter((item) => item.tournamentId === tournament.id) }));
}
