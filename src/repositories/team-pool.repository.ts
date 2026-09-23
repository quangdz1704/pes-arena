import "server-only";

import { randomUUID } from "node:crypto";

import { asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { teamPoolMembers, teamPools, teams } from "@/db/schema";

export type TeamPoolDto = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  isActive: boolean;
  teamIds: string[];
};

type SaveTeamPoolValues = {
  id?: string;
  name: string;
  emoji: string | null;
  description: string | null;
  teamIds: string[];
};

export async function listTeamPoolRecords(): Promise<TeamPoolDto[]> {
  const db = getDb();
  const pools = await db
    .select()
    .from(teamPools)
    .orderBy(desc(teamPools.isActive), asc(teamPools.name));

  if (pools.length === 0) return [];

  const memberships = await db
    .select({
      teamPoolId: teamPoolMembers.teamPoolId,
      teamId: teamPoolMembers.teamId,
    })
    .from(teamPoolMembers)
    .where(
      inArray(
        teamPoolMembers.teamPoolId,
        pools.map((pool) => pool.id),
      ),
    );

  const teamIdsByPool = new Map<string, string[]>();
  for (const membership of memberships) {
    const ids = teamIdsByPool.get(membership.teamPoolId) ?? [];
    ids.push(membership.teamId);
    teamIdsByPool.set(membership.teamPoolId, ids);
  }

  return pools.map((pool) => ({
    id: pool.id,
    name: pool.name,
    emoji: pool.emoji,
    description: pool.description,
    isActive: pool.isActive,
    teamIds: teamIdsByPool.get(pool.id) ?? [],
  }));
}

export async function saveTeamPoolRecord(values: SaveTeamPoolValues) {
  const db = getDb();
  const poolId = values.id ?? randomUUID();

  if (values.id) {
    const [existingPool] = await db
      .select({ id: teamPools.id })
      .from(teamPools)
      .where(eq(teamPools.id, poolId));
    if (!existingPool) throw new Error("Không tìm thấy nhóm đội.");
  }

  if (values.teamIds.length > 0) {
    const activeTeams = await db
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.id, values.teamIds));

    if (activeTeams.length !== new Set(values.teamIds).size) {
      throw new Error("Danh sách đội chứa đội không tồn tại.");
    }
  }

  const poolValues = {
    name: values.name,
    emoji: values.emoji,
    description: values.description,
    updatedAt: new Date(),
  };
  const poolQuery = values.id
    ? db.update(teamPools).set(poolValues).where(eq(teamPools.id, poolId))
    : db.insert(teamPools).values({ id: poolId, ...poolValues });
  const deleteMembershipsQuery = db
    .delete(teamPoolMembers)
    .where(eq(teamPoolMembers.teamPoolId, poolId));

  if (values.teamIds.length > 0) {
    await db.batch([
      poolQuery,
      deleteMembershipsQuery,
      db.insert(teamPoolMembers).values(
        values.teamIds.map((teamId) => ({ teamPoolId: poolId, teamId })),
      ),
    ]);
  } else {
    await db.batch([poolQuery, deleteMembershipsQuery]);
  }

  return { id: poolId };
}

export async function setTeamPoolActiveRecord(
  id: string,
  isActive: boolean,
) {
  const [pool] = await getDb()
    .update(teamPools)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(teamPools.id, id))
    .returning({ id: teamPools.id });
  return pool;
}
