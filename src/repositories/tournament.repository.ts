import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
  players,
  matches,
  matchSides,
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

  const matchIds = fixtures.flatMap((fixture) => fixture.matchId ? [fixture.matchId] : []);
  const [fixtureMatches, fixtureScores] = await Promise.all([
    matchIds.length
      ? db.select({ id: matches.id, status: matches.status }).from(matches).where(inArray(matches.id, matchIds))
      : Promise.resolve([]),
    matchIds.length
      ? db.select({ matchId: matchSides.matchId, side: matchSides.side, score: matchSides.score }).from(matchSides).where(inArray(matchSides.matchId, matchIds))
      : Promise.resolve([]),
  ]);
  const matchById = new Map(fixtureMatches.map((match) => [match.id, match]));
  const scoresByMatchId = new Map<string, { A: number | null; B: number | null }>();
  for (const score of fixtureScores) {
    const current = scoresByMatchId.get(score.matchId) ?? { A: null, B: null };
    current[score.side] = score.score;
    scoresByMatchId.set(score.matchId, current);
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
      matchStatus: fixture.matchId ? matchById.get(fixture.matchId)?.status ?? null : null,
      homeScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.A ?? null : null,
      awayScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.B ?? null : null,
      homeName: nameByCompetitorId.get(fixture.homeCompetitorId) ?? "Chưa rõ",
      awayName: nameByCompetitorId.get(fixture.awayCompetitorId) ?? "Chưa rõ",
    })),
  };
}

export async function getTournamentFixtureForMatchStart(fixtureId: string) {
  const db = getDb();
  const [fixture] = await db
    .select()
    .from(tournamentFixtures)
    .where(eq(tournamentFixtures.id, fixtureId));
  if (!fixture) return null;

  const competitorPlayers = await db
    .select({
      competitorId: tournamentCompetitorPlayers.competitorId,
      playerId: tournamentCompetitorPlayers.playerId,
      name: players.name,
    })
    .from(tournamentCompetitorPlayers)
    .innerJoin(players, eq(tournamentCompetitorPlayers.playerId, players.id))
    .where(inArray(tournamentCompetitorPlayers.competitorId, [fixture.homeCompetitorId, fixture.awayCompetitorId]));
  const getPlayers = (competitorId: string) => competitorPlayers.filter((player) => player.competitorId === competitorId);
  const homePlayers = getPlayers(fixture.homeCompetitorId);
  const awayPlayers = getPlayers(fixture.awayCompetitorId);
  if (!homePlayers.length || !awayPlayers.length) return null;

  return {
    id: fixture.id,
    tournamentId: fixture.tournamentId,
    matchId: fixture.matchId,
    homePlayerIds: homePlayers.map((player) => player.playerId),
    awayPlayerIds: awayPlayers.map((player) => player.playerId),
    homeName: homePlayers.map((player) => player.name).join(" + "),
    awayName: awayPlayers.map((player) => player.name).join(" + "),
  };
}
