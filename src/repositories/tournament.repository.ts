import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
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
import { generateKnockoutRound } from "@/services/knockout";

export async function createLeagueRecord(input: {
  name: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  competitorPlayerIds: string[][];
}) {
  const tournamentId = randomUUID();
  const competitors = input.competitorPlayerIds.map((playerIds) => ({ id: randomUUID(), playerIds }));
  const fixtures = generateRoundRobin(competitors);
  await getDb().batch([
    getDb().insert(tournaments).values({ id: tournamentId, name: input.name, type: "LEAGUE", matchMode: input.matchMode, status: "ACTIVE" }),
    getDb().insert(tournamentCompetitors).values(competitors.map((competitor, index) => ({ id: competitor.id, tournamentId, displayName: `Competitor ${index + 1}`, seed: index + 1 }))),
    getDb().insert(tournamentCompetitorPlayers).values(competitors.flatMap((competitor) => competitor.playerIds.map((playerId, index) => ({ competitorId: competitor.id, playerId, position: index + 1 })))),
    getDb().insert(tournamentFixtures).values(fixtures.map((fixture) => ({ tournamentId, round: fixture.round, homeCompetitorId: fixture.home.id, awayCompetitorId: fixture.away.id }))),
  ]);
  return tournamentId;
}

export async function createKnockoutRecord(input: {
  name: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  competitorPlayerIds: string[][];
}) {
  const tournamentId = randomUUID();
  const competitors = input.competitorPlayerIds.map((playerIds) => ({
    id: randomUUID(),
    playerIds,
  }));
  const fixtures = generateKnockoutRound(competitors);
  const db = getDb();

  await db.batch([
    db.insert(tournaments).values({
      id: tournamentId,
      name: input.name,
      type: "KNOCKOUT",
      matchMode: input.matchMode,
      status: "ACTIVE",
    }),
    db.insert(tournamentCompetitors).values(
      competitors.map((competitor, index) => ({
        id: competitor.id,
        tournamentId,
        displayName: `Competitor ${index + 1}`,
        seed: index + 1,
      })),
    ),
    db.insert(tournamentCompetitorPlayers).values(
      competitors.flatMap((competitor) =>
        competitor.playerIds.map((playerId, index) => ({
          competitorId: competitor.id,
          playerId,
          position: index + 1,
        })),
      ),
    ),
    db.insert(tournamentFixtures).values(
      fixtures.map((fixture) => ({
        tournamentId,
        round: fixture.round,
        homeCompetitorId: fixture.home.id,
        awayCompetitorId: fixture.away.id,
      })),
    ),
  ]);

  return tournamentId;
}

export async function finishTournamentIfComplete(tournamentId: string) {
  await getDb().execute(sql`
    update tournaments
    set status = 'FINISHED'::tournament_status, updated_at = now()
    where id = ${tournamentId}::uuid
      and status = 'ACTIVE'::tournament_status
      and type = 'LEAGUE'::tournament_type
      and not exists (
        select 1
        from tournament_fixtures fixture
        left join matches match on match.id = fixture.match_id
        where fixture.tournament_id = ${tournamentId}::uuid
          and (match.status is distinct from 'FINISHED'::match_status)
      )
  `);
}

export async function getTournamentType(tournamentId: string) {
  const [tournament] = await getDb()
    .select({ type: tournaments.type })
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));
  return tournament?.type ?? null;
}

export async function advanceKnockoutTournament(tournamentId: string) {
  const db = getDb();
  const [tournament] = await db
    .select({ id: tournaments.id, status: tournaments.status, type: tournaments.type })
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));
  if (!tournament || tournament.status !== "ACTIVE" || tournament.type !== "KNOCKOUT") return;

  const fixtures = await db
    .select()
    .from(tournamentFixtures)
    .where(eq(tournamentFixtures.tournamentId, tournamentId))
    .orderBy(asc(tournamentFixtures.round), asc(tournamentFixtures.createdAt));
  const currentRound = fixtures.at(-1)?.round;
  if (!currentRound) return;

  const currentRoundFixtures = fixtures.filter((fixture) => fixture.round === currentRound);
  if (currentRoundFixtures.some((fixture) => !fixture.matchId)) return;
  const matchIds = currentRoundFixtures.flatMap((fixture) => (fixture.matchId ? [fixture.matchId] : []));
  const matchRows = await db
    .select({ id: matches.id, status: matches.status })
    .from(matches)
    .where(inArray(matches.id, matchIds));
  if (matchRows.length !== currentRoundFixtures.length || matchRows.some((match) => match.status !== "FINISHED")) return;

  const scoreRows = await db
    .select({ matchId: matchSides.matchId, side: matchSides.side, score: matchSides.score })
    .from(matchSides)
    .where(inArray(matchSides.matchId, matchIds));
  const scoresByMatchId = new Map<string, { A: number | null; B: number | null }>();
  for (const score of scoreRows) {
    const scores = scoresByMatchId.get(score.matchId) ?? { A: null, B: null };
    scores[score.side] = score.score;
    scoresByMatchId.set(score.matchId, scores);
  }

  const winners = currentRoundFixtures.map((fixture) => {
    const scores = fixture.matchId ? scoresByMatchId.get(fixture.matchId) : null;
    if (!scores || scores.A === null || scores.B === null || scores.A === scores.B) {
      throw new Error("Trận knockout phải có đội thắng trước khi sang vòng tiếp theo.");
    }
    return scores.A > scores.B ? fixture.homeCompetitorId : fixture.awayCompetitorId;
  });

  if (winners.length === 1) {
    await db
      .update(tournaments)
      .set({ status: "FINISHED", updatedAt: new Date() })
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.status, "ACTIVE")));
    return;
  }

  const nextFixtures = generateKnockoutRound(winners, currentRound + 1);
  await db
    .insert(tournamentFixtures)
    .values(
      nextFixtures.map((fixture) => ({
        tournamentId,
        round: fixture.round,
        homeCompetitorId: fixture.home,
        awayCompetitorId: fixture.away,
      })),
    )
    .onConflictDoNothing();
}

export async function cancelTournamentRecord(tournamentId: string) {
  const db = getDb();
  const [activeMatch] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.tournamentId, tournamentId), eq(matches.status, "PLAYING")))
    .limit(1);
  if (activeMatch) {
    throw new Error("Không thể huỷ giải khi vẫn còn trận đang diễn ra.");
  }

  const cancelled = await db
    .update(tournaments)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.status, "ACTIVE")))
    .returning({ id: tournaments.id });
  if (!cancelled[0]) {
    throw new Error("Giải đấu không tồn tại hoặc không còn diễn ra.");
  }
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
  const [tournament] = await db
    .select({ matchMode: tournaments.matchMode, status: tournaments.status })
    .from(tournaments)
    .where(eq(tournaments.id, fixture.tournamentId));
  if (!tournament) return null;

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
    matchMode: tournament.matchMode,
    tournamentStatus: tournament.status,
    matchId: fixture.matchId,
    homePlayerIds: homePlayers.map((player) => player.playerId),
    awayPlayerIds: awayPlayers.map((player) => player.playerId),
    homeName: homePlayers.map((player) => player.name).join(" + "),
    awayName: awayPlayers.map((player) => player.name).join(" + "),
  };
}
