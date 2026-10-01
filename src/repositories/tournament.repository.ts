import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
  players,
  matches,
  matchSides,
  teams,
  tournamentCompetitorPlayers,
  tournamentCompetitors,
  tournamentFixtures,
  tournamentFixtureTeams,
  tournaments,
} from "@/db/schema";

import { generateHomeAndAwayRoundRobin, generateRoundRobin } from "@/services/round-robin";
import { generateKnockoutRound, getKnockoutBracketSeedOrder } from "@/services/knockout";
import { getTournamentPlacements } from "@/services/tournament-results";
import { numberFixtures, type FixtureTeamAssignment } from "@/services/tournament-team-plan";

export type PlayerTournamentHonor = {
  tournamentId: string;
  tournamentName: string;
  tournamentType: "LEAGUE" | "KNOCKOUT";
  place: 1 | 2 | 3;
};

export async function createLeagueRecord(input: {
  name: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  competitorPlayerIds: string[][];
  teamPoolId: string | null;
  teamIds: string[];
  fixtureTeams: FixtureTeamAssignment[];
  isHomeAndAway: boolean;
}) {
  const tournamentId = randomUUID();
  const competitors = input.competitorPlayerIds.map((playerIds, index) => ({ id: randomUUID(), playerIds, teamId: input.teamIds[index] ?? null }));
  const fixtures = numberFixtures(input.isHomeAndAway ? generateHomeAndAwayRoundRobin(competitors) : generateRoundRobin(competitors));
  await getDb().batch([
    getDb().insert(tournaments).values({ id: tournamentId, name: input.name, type: "LEAGUE", matchMode: input.matchMode, teamPoolId: input.teamPoolId, isHomeAndAway: input.isHomeAndAway, status: "ACTIVE" }),
    getDb().insert(tournamentCompetitors).values(competitors.map((competitor, index) => ({ id: competitor.id, tournamentId, displayName: `Competitor ${index + 1}`, teamId: competitor.teamId, seed: index + 1 }))),
    getDb().insert(tournamentCompetitorPlayers).values(competitors.flatMap((competitor) => competitor.playerIds.map((playerId, index) => ({ competitorId: competitor.id, playerId, position: index + 1 })))),
    getDb().insert(tournamentFixtures).values(fixtures.map((fixture) => ({ tournamentId, round: fixture.round, position: fixture.position, homeCompetitorId: fixture.home.id, awayCompetitorId: fixture.away.id }))),
    ...(input.fixtureTeams.length ? [getDb().insert(tournamentFixtureTeams).values(input.fixtureTeams.map((fixture) => ({ ...fixture, tournamentId })))] : []),
  ]);
  return tournamentId;
}

export async function createKnockoutRecord(input: {
  name: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  competitorPlayerIds: string[][];
  teamPoolId: string | null;
  teamIds: string[];
  fixtureTeams: FixtureTeamAssignment[];
  isHomeAndAway: boolean;
}) {
  const tournamentId = randomUUID();
  const competitors = input.competitorPlayerIds.map((playerIds, index) => ({
    id: randomUUID(),
    playerIds,
    teamId: input.teamIds[index] ?? null,
  }));
  const bracketCompetitors = getKnockoutBracketSeedOrder(competitors.length).map(
    (seed) => competitors[seed - 1]!,
  );
  const fixtures = numberFixtures(generateKnockoutRound(bracketCompetitors));
  const db = getDb();

  await db.batch([
    db.insert(tournaments).values({
      id: tournamentId,
      name: input.name,
      type: "KNOCKOUT",
      matchMode: input.matchMode,
      teamPoolId: input.teamPoolId,
      isHomeAndAway: input.isHomeAndAway,
      status: "ACTIVE",
    }),
    db.insert(tournamentCompetitors).values(
      competitors.map((competitor, index) => ({
        id: competitor.id,
        tournamentId,
        displayName: `Competitor ${index + 1}`,
        teamId: competitor.teamId,
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
        position: fixture.position,
        homeCompetitorId: fixture.home.id,
        awayCompetitorId: fixture.away.id,
      })),
    ),
    ...(input.fixtureTeams.length ? [db.insert(tournamentFixtureTeams).values(input.fixtureTeams.map((fixture) => ({ ...fixture, tournamentId })))] : []),
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
    .orderBy(asc(tournamentFixtures.round), asc(tournamentFixtures.position), asc(tournamentFixtures.createdAt));
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

  const nextFixtures = numberFixtures(generateKnockoutRound(winners, currentRound + 1));
  await db
    .insert(tournamentFixtures)
    .values(
      nextFixtures.map((fixture) => ({
        tournamentId,
        round: fixture.round,
        position: fixture.position,
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
  const fixtureTeams = await db.select().from(tournamentFixtureTeams).where(eq(tournamentFixtureTeams.tournamentId, tournamentId));
  const assignedTeamIds = [...new Set([
    ...competitors.flatMap((competitor) => competitor.teamId ? [competitor.teamId] : []),
    ...fixtureTeams.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId]),
  ])];

  const [competitorPlayers, fixtures, competitorTeams] = await Promise.all([
    competitorIds.length
      ? db
          .select({
            competitorId: tournamentCompetitorPlayers.competitorId,
            playerId: tournamentCompetitorPlayers.playerId,
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
      .orderBy(asc(tournamentFixtures.round), asc(tournamentFixtures.position), asc(tournamentFixtures.createdAt), asc(tournamentFixtures.id)),
    assignedTeamIds.length
      ? db.select({ id: teams.id, name: teams.name, shortName: teams.shortName }).from(teams).where(inArray(teams.id, assignedTeamIds))
      : Promise.resolve([]),
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
  const teamById = new Map(competitorTeams.map((team) => [team.id, team]));
  const teamByCompetitorId = new Map(competitors.flatMap((competitor) => competitor.teamId ? [[competitor.id, teamById.get(competitor.teamId)]] as const : []));
  const teamsBySlot = new Map(fixtureTeams.map((fixture) => [`${fixture.round}:${fixture.position}`, fixture]));

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
    teamAssignmentScope: fixtureTeams.length ? "PER_MATCH" : competitors.some((competitor) => competitor.teamId) ? "FIXED" : "NONE",
    plannedFixtureTeams: fixtureTeams.map((fixture) => ({
      round: fixture.round,
      position: fixture.position,
      homeTeamName: teamById.get(fixture.homeTeamId)?.name ?? "Chưa rõ",
      awayTeamName: teamById.get(fixture.awayTeamId)?.name ?? "Chưa rõ",
    })).sort((a, b) => a.round - b.round || a.position - b.position),
    competitors: competitors.map((competitor) => ({
      id: competitor.id,
      name: nameByCompetitorId.get(competitor.id) ?? competitor.displayName,
      seed: competitor.seed,
      teamId: competitor.teamId,
      teamName: competitor.teamId ? teamById.get(competitor.teamId)?.name ?? null : null,
      playerIds: competitorPlayers
        .filter((player) => player.competitorId === competitor.id)
        .map((player) => player.playerId),
    })),
    fixtures: fixtures.map((fixture) => ({
      id: fixture.id,
      round: fixture.round,
      homeCompetitorId: fixture.homeCompetitorId,
      awayCompetitorId: fixture.awayCompetitorId,
      matchId: fixture.matchId,
      matchStatus: fixture.matchId ? matchById.get(fixture.matchId)?.status ?? null : null,
      homeScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.A ?? null : null,
      awayScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.B ?? null : null,
      homeName: nameByCompetitorId.get(fixture.homeCompetitorId) ?? "Chưa rõ",
      awayName: nameByCompetitorId.get(fixture.awayCompetitorId) ?? "Chưa rõ",
      homeTeamName: teamById.get(teamsBySlot.get(`${fixture.round}:${fixture.position}`)?.homeTeamId ?? "")?.name ?? teamByCompetitorId.get(fixture.homeCompetitorId)?.name ?? null,
      awayTeamName: teamById.get(teamsBySlot.get(`${fixture.round}:${fixture.position}`)?.awayTeamId ?? "")?.name ?? teamByCompetitorId.get(fixture.awayCompetitorId)?.name ?? null,
    })),
  };
}

export async function listPlayerTournamentHonors(): Promise<Map<string, PlayerTournamentHonor[]>> {
  const db = getDb();
  const completedTournaments = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      type: tournaments.type,
      status: tournaments.status,
      createdAt: tournaments.createdAt,
    })
    .from(tournaments)
    .where(eq(tournaments.status, "FINISHED"))
    .orderBy(desc(tournaments.createdAt));
  if (completedTournaments.length === 0) return new Map();

  const tournamentIds = completedTournaments.map((tournament) => tournament.id);
  const competitorRows = await db
    .select()
    .from(tournamentCompetitors)
    .where(inArray(tournamentCompetitors.tournamentId, tournamentIds));
  const competitorIds = competitorRows.map((competitor) => competitor.id);
  const [competitorPlayers, fixtureRows] = await Promise.all([
    competitorIds.length
      ? db
          .select({
            competitorId: tournamentCompetitorPlayers.competitorId,
            playerId: tournamentCompetitorPlayers.playerId,
          })
          .from(tournamentCompetitorPlayers)
          .where(inArray(tournamentCompetitorPlayers.competitorId, competitorIds))
      : Promise.resolve([]),
    db
      .select()
      .from(tournamentFixtures)
      .where(inArray(tournamentFixtures.tournamentId, tournamentIds)),
  ]);
  const matchIds = fixtureRows.flatMap((fixture) => (fixture.matchId ? [fixture.matchId] : []));
  const [matchRows, scoreRows] = await Promise.all([
    matchIds.length
      ? db
          .select({ id: matches.id, status: matches.status })
          .from(matches)
          .where(inArray(matches.id, matchIds))
      : Promise.resolve([]),
    matchIds.length
      ? db
          .select({ matchId: matchSides.matchId, side: matchSides.side, score: matchSides.score })
          .from(matchSides)
          .where(inArray(matchSides.matchId, matchIds))
      : Promise.resolve([]),
  ]);
  const statusByMatchId = new Map(matchRows.map((match) => [match.id, match.status]));
  const scoresByMatchId = new Map<string, { A: number | null; B: number | null }>();
  for (const score of scoreRows) {
    const current = scoresByMatchId.get(score.matchId) ?? { A: null, B: null };
    current[score.side] = score.score;
    scoresByMatchId.set(score.matchId, current);
  }

  const playerIdsByCompetitor = new Map<string, string[]>();
  for (const member of competitorPlayers) {
    playerIdsByCompetitor.set(member.competitorId, [
      ...(playerIdsByCompetitor.get(member.competitorId) ?? []),
      member.playerId,
    ]);
  }
  const honorsByPlayer = new Map<string, PlayerTournamentHonor[]>();
  for (const tournament of completedTournaments) {
    const competitors = competitorRows
      .filter((competitor) => competitor.tournamentId === tournament.id)
      .map((competitor) => ({
        id: competitor.id,
        name: competitor.displayName,
        seed: competitor.seed,
      }));
    const fixtures = fixtureRows
      .filter((fixture) => fixture.tournamentId === tournament.id)
      .map((fixture) => ({
        round: fixture.round,
        homeCompetitorId: fixture.homeCompetitorId,
        awayCompetitorId: fixture.awayCompetitorId,
        matchStatus: fixture.matchId ? statusByMatchId.get(fixture.matchId) ?? null : null,
        homeScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.A ?? null : null,
        awayScore: fixture.matchId ? scoresByMatchId.get(fixture.matchId)?.B ?? null : null,
      }));
    const placements = getTournamentPlacements({
      type: tournament.type,
      status: tournament.status,
      competitors,
      fixtures,
    });

    for (const placement of placements) {
      for (const playerId of playerIdsByCompetitor.get(placement.competitorId) ?? []) {
        const honors = honorsByPlayer.get(playerId) ?? [];
        honors.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentType: tournament.type,
          place: placement.place,
        });
        honorsByPlayer.set(playerId, honors);
      }
    }
  }

  return honorsByPlayer;
}

export async function getTournamentFixtureForMatchStart(fixtureId: string) {
  const db = getDb();
  const [fixture] = await db
    .select()
    .from(tournamentFixtures)
    .where(eq(tournamentFixtures.id, fixtureId));
  if (!fixture) return null;
  const [tournament] = await db
    .select({ matchMode: tournaments.matchMode, status: tournaments.status, teamPoolId: tournaments.teamPoolId })
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
  const assignedCompetitors = await db
    .select({ id: tournamentCompetitors.id, teamId: tournamentCompetitors.teamId })
    .from(tournamentCompetitors)
    .where(inArray(tournamentCompetitors.id, [fixture.homeCompetitorId, fixture.awayCompetitorId]));
  const teamIdByCompetitor = new Map(assignedCompetitors.map((competitor) => [competitor.id, competitor.teamId]));
  const [fixtureTeams] = await db.select().from(tournamentFixtureTeams).where(and(
    eq(tournamentFixtureTeams.tournamentId, fixture.tournamentId),
    eq(tournamentFixtureTeams.round, fixture.round),
    eq(tournamentFixtureTeams.position, fixture.position),
  ));

  return {
    id: fixture.id,
    tournamentId: fixture.tournamentId,
    matchMode: tournament.matchMode,
    tournamentStatus: tournament.status,
    teamPoolId: tournament.teamPoolId,
    matchId: fixture.matchId,
    homePlayerIds: homePlayers.map((player) => player.playerId),
    awayPlayerIds: awayPlayers.map((player) => player.playerId),
    homeName: homePlayers.map((player) => player.name).join(" + "),
    awayName: awayPlayers.map((player) => player.name).join(" + "),
    homeTeamId: fixtureTeams?.homeTeamId ?? teamIdByCompetitor.get(fixture.homeCompetitorId) ?? null,
    awayTeamId: fixtureTeams?.awayTeamId ?? teamIdByCompetitor.get(fixture.awayCompetitorId) ?? null,
  };
}
