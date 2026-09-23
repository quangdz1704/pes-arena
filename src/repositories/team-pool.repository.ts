import "server-only";

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

  return db.transaction(async (tx) => {
    const poolValues = {
      name: values.name,
      emoji: values.emoji,
      description: values.description,
      updatedAt: new Date(),
    };

    const [pool] = values.id
      ? await tx
          .update(teamPools)
          .set(poolValues)
          .where(eq(teamPools.id, values.id))
          .returning({ id: teamPools.id })
      : await tx
          .insert(teamPools)
          .values(poolValues)
          .returning({ id: teamPools.id });

    if (!pool) throw new Error("Không tìm thấy nhóm đội.");

    await tx
      .delete(teamPoolMembers)
      .where(eq(teamPoolMembers.teamPoolId, pool.id));

    if (values.teamIds.length > 0) {
      const activeTeams = await tx
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.id, values.teamIds));

      if (activeTeams.length !== new Set(values.teamIds).size) {
        throw new Error("Danh sách đội chứa đội không tồn tại.");
      }

      await tx.insert(teamPoolMembers).values(
        activeTeams.map((team) => ({
          teamPoolId: pool.id,
          teamId: team.id,
        })),
      );
    }

    return pool;
  });
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
