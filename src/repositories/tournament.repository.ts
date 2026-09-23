import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
  players,
  tournamentCompetitorPlayers,
  tournamentCompetitors,
  tournamentFixtures,
  tournaments,
} from "@/db/schema";

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

export async function getTournamentRecord(tournamentId: string) {
  const db = getDb();
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!tournament) return null;

  const competitors = await db
    .select()
    .from(tournamentCompetitors)
    .where(eq(tournamentCompetitors.tournamentId, tournamentId))
    .orderBy(asc(tournamentCompetitors.seed));
  const competitorIds = competitors.map((competitor) => competitor.id);

  const [competitorPlayers, fixtures] = await Promise.all([
    competitorIds.length
      ? db
          .select({
            competitorId: tournamentCompetitorPlayers.competitorId,
            name: players.name,
            position: tournamentCompetitorPlayers.position,
          })
          .from(tournamentCompetitorPlayers)
          .innerJoin(players, eq(tournamentCompetitorPlayers.playerId, players.id))
          .where(inArray(tournamentCompetitorPlayers.competitorId, competitorIds))
          .orderBy(asc(tournamentCompetitorPlayers.position))
      : Promise.resolve([]),
    db
      .select()
      .from(tournamentFixtures)
      .where(eq(tournamentFixtures.tournamentId, tournamentId))
      .orderBy(asc(tournamentFixtures.round)),
  ]);

  const nameByCompetitorId = new Map(
    competitors.map((competitor) => [competitor.id, competitor.displayName]),
  );
  for (const competitor of competitors) {
    const names = competitorPlayers
      .filter((player) => player.competitorId === competitor.id)
      .map((player) => player.name);
    if (names.length) nameByCompetitorId.set(competitor.id, names.join(" + "));
  }

  return {
    ...tournament,
    competitors: competitors.map((competitor) => ({
      id: competitor.id,
      name: nameByCompetitorId.get(competitor.id) ?? competitor.displayName,
      seed: competitor.seed,
    })),
    fixtures: fixtures.map((fixture) => ({
      id: fixture.id,
      round: fixture.round,
      matchId: fixture.matchId,
      homeName: nameByCompetitorId.get(fixture.homeCompetitorId) ?? "Chưa rõ",
      awayName: nameByCompetitorId.get(fixture.awayCompetitorId) ?? "Chưa rõ",
    })),
  };
}
