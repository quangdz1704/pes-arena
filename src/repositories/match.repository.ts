import "server-only";

import { randomUUID } from "node:crypto";

import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  matchSidePlayers,
  matchSides,
  matches,
  players,
  teamPoolMembers,
  teamPools,
  teams,
} from "@/db/schema";

export type MatchPlayerDto = {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
};

export type MatchTeamDto = {
  id: string;
  name: string;
  shortName: string;
  tier: "S" | "A" | "B" | "C";
  rating: number;
};

export type MatchTeamPoolDto = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  teams: MatchTeamDto[];
};

export type MatchSetupDto = {
  players: MatchPlayerDto[];
  pools: MatchTeamPoolDto[];
};

export type MatchSideDto = {
  id: string;
  side: "A" | "B";
  score: number | null;
  rerollCount: number;
  team: MatchTeamDto | null;
  players: MatchPlayerDto[];
};

export type MatchDetailDto = {
  id: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  status: "CREATED" | "PLAYING" | "FINISHED" | "CANCELLED";
  randomMode: "PURE" | "BALANCED" | null;
  isRanked: boolean;
  playedAt: string | null;
  createdAt: string;
  sides: [MatchSideDto, MatchSideDto];
};

type CreateMatchValues = {
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  teamPoolId: string;
  randomMode: "PURE" | "BALANCED";
  isRanked: boolean;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  sideATeamId: string;
  sideBTeamId: string;
  sideARerollCount: number;
  sideBRerollCount: number;
};

function toPlayerDto(player: typeof players.$inferSelect): MatchPlayerDto {
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl,
  };
}

function toTeamDto(team: typeof teams.$inferSelect): MatchTeamDto {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    tier: team.tier,
    rating: team.rating,
  };
}

export async function getMatchSetupRecords(): Promise<MatchSetupDto> {
  const db = getDb();
  const [playerRows, poolRows, teamRows, memberships] = await Promise.all([
    db.select().from(players).where(eq(players.isActive, true)).orderBy(asc(players.name)),
    db.select().from(teamPools).where(eq(teamPools.isActive, true)).orderBy(asc(teamPools.name)),
    db.select().from(teams).where(eq(teams.isActive, true)).orderBy(desc(teams.rating)),
    db.select().from(teamPoolMembers),
  ]);
  const teamById = new Map(teamRows.map((team) => [team.id, toTeamDto(team)]));
  const teamIdsByPool = new Map<string, string[]>();

  for (const membership of memberships) {
    const ids = teamIdsByPool.get(membership.teamPoolId) ?? [];
    ids.push(membership.teamId);
    teamIdsByPool.set(membership.teamPoolId, ids);
  }

  return {
    players: playerRows.map(toPlayerDto),
    pools: poolRows.map((pool) => ({
      id: pool.id,
      name: pool.name,
      emoji: pool.emoji,
      description: pool.description,
      teams: (teamIdsByPool.get(pool.id) ?? [])
        .map((teamId) => teamById.get(teamId))
        .filter((team): team is MatchTeamDto => Boolean(team)),
    })),
  };
}

export async function createPlayingMatchRecord(values: CreateMatchValues) {
  const db = getDb();
  const matchId = randomUUID();
  const sideAId = randomUUID();
  const sideBId = randomUUID();

  await db.batch([
    db.insert(matches).values({
      id: matchId,
      matchMode: values.matchMode,
      status: "PLAYING",
      teamPoolId: values.teamPoolId,
      randomMode: values.randomMode,
      isRanked: values.isRanked,
      updatedAt: new Date(),
    }),
    db.insert(matchSides).values([
      {
        id: sideAId,
        matchId,
        side: "A",
        teamId: values.sideATeamId,
        rerollCount: values.sideARerollCount,
      },
      {
        id: sideBId,
        matchId,
        side: "B",
        teamId: values.sideBTeamId,
        rerollCount: values.sideBRerollCount,
      },
    ]),
    db.insert(matchSidePlayers).values([
      ...values.sideAPlayerIds.map((playerId, index) => ({
        matchId,
        matchSideId: sideAId,
        playerId,
        position: index + 1,
      })),
      ...values.sideBPlayerIds.map((playerId, index) => ({
        matchId,
        matchSideId: sideBId,
        playerId,
        position: index + 1,
      })),
    ]),
  ]);

  return { id: matchId };
}

async function getSidesForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return new Map<string, MatchSideDto[]>();

  const db = getDb();
  const sideRows = await db
    .select({
      id: matchSides.id,
      matchId: matchSides.matchId,
      side: matchSides.side,
      score: matchSides.score,
      rerollCount: matchSides.rerollCount,
      team: teams,
    })
    .from(matchSides)
    .leftJoin(teams, eq(matchSides.teamId, teams.id))
    .where(inArray(matchSides.matchId, matchIds));
  const playerRows = await db
    .select({
      matchSideId: matchSidePlayers.matchSideId,
      position: matchSidePlayers.position,
      player: players,
    })
    .from(matchSidePlayers)
    .innerJoin(players, eq(matchSidePlayers.playerId, players.id))
    .where(inArray(matchSidePlayers.matchId, matchIds))
    .orderBy(asc(matchSidePlayers.position));
  const playersBySide = new Map<string, MatchPlayerDto[]>();

  for (const row of playerRows) {
    const sidePlayers = playersBySide.get(row.matchSideId) ?? [];
    sidePlayers.push(toPlayerDto(row.player));
    playersBySide.set(row.matchSideId, sidePlayers);
  }

  const sidesByMatch = new Map<string, MatchSideDto[]>();
  for (const row of sideRows) {
    const sides = sidesByMatch.get(row.matchId) ?? [];
    sides.push({
      id: row.id,
      side: row.side,
      score: row.score,
      rerollCount: row.rerollCount,
      team: row.team ? toTeamDto(row.team) : null,
      players: playersBySide.get(row.id) ?? [],
    });
    sidesByMatch.set(row.matchId, sides);
  }

  for (const sides of sidesByMatch.values()) {
    sides.sort((first, second) => first.side.localeCompare(second.side));
  }

  return sidesByMatch;
}

function toMatchDetail(
  match: typeof matches.$inferSelect,
  sides: MatchSideDto[],
): MatchDetailDto | null {
  if (sides.length !== 2) return null;

  return {
    id: match.id,
    matchMode: match.matchMode,
    status: match.status,
    randomMode: match.randomMode,
    isRanked: match.isRanked,
    playedAt: match.playedAt?.toISOString() ?? null,
    createdAt: match.createdAt.toISOString(),
    sides: [sides[0]!, sides[1]!],
  };
}

export async function getMatchRecord(id: string) {
  const [match] = await getDb().select().from(matches).where(eq(matches.id, id));
  if (!match) return null;

  const sidesByMatch = await getSidesForMatches([id]);
  return toMatchDetail(match, sidesByMatch.get(id) ?? []);
}

export async function listMatchHistoryRecords(limit = 50): Promise<MatchDetailDto[]> {
  const matchRows = await getDb()
    .select()
    .from(matches)
    .where(eq(matches.status, "FINISHED"))
    .orderBy(desc(matches.playedAt), desc(matches.createdAt))
    .limit(limit);
  const sidesByMatch = await getSidesForMatches(matchRows.map((match) => match.id));

  return matchRows.flatMap((match) => {
    const detail = toMatchDetail(match, sidesByMatch.get(match.id) ?? []);
    return detail ? [detail] : [];
  });
}

export async function finishMatchRecord(id: string, sideAScore: number, sideBScore: number) {
  const result = await getDb().execute(sql`
    with finished_match as (
      update matches
      set status = 'FINISHED'::match_status, played_at = now(), updated_at = now()
      where id = ${id} and status = 'PLAYING'::match_status
      returning id
    ), scored_sides as (
      update match_sides
      set score = case when side = 'A'::match_side then ${sideAScore} else ${sideBScore} end
      where match_id in (select id from finished_match)
    )
    select id from finished_match
  `);
  const match = result.rows[0];
  if (!match) throw new Error("Trận đấu không tồn tại hoặc đã được lưu kết quả.");

  return match;
}
