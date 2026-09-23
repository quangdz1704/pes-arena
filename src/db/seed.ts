import { inArray } from "drizzle-orm";

import { getDb } from "./index";
import {
  defaultPoolSeeds,
  midClubSeeds,
  nationalTeamSeeds,
  teamSeeds,
  topClubSeeds,
} from "./seed-data";
import { appSettings, teamPoolMembers, teamPools, teams } from "./schema";

async function seed() {
  const db = getDb();

  await db.insert(teams).values(teamSeeds).onConflictDoNothing({
    target: teams.name,
  });

  await db.insert(teamPools).values([...defaultPoolSeeds]).onConflictDoNothing({
    target: teamPools.name,
  });

  await db.insert(appSettings).values({ id: "default" }).onConflictDoNothing({
    target: appSettings.id,
  });

  const seededTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(
      inArray(
        teams.name,
        teamSeeds.map((team) => team.name),
      ),
    );
  const seededPools = await db
    .select({ id: teamPools.id, name: teamPools.name })
    .from(teamPools)
    .where(
      inArray(
        teamPools.name,
        defaultPoolSeeds.map((pool) => pool.name),
      ),
    );

  const teamIdByName = new Map(seededTeams.map((team) => [team.name, team.id]));
  const poolIdByName = new Map(seededPools.map((pool) => [pool.name, pool.id]));

  const poolMemberships = [
    ["CLB hàng đầu", topClubSeeds],
    ["CLB tầm trung", midClubSeeds],
    ["Đội tuyển quốc gia", nationalTeamSeeds],
    ["Tất cả", teamSeeds],
  ] as const;

  for (const [poolName, poolTeams] of poolMemberships) {
    const teamPoolId = poolIdByName.get(poolName);
    if (!teamPoolId) continue;

    const values = poolTeams.flatMap((team) => {
      const teamId = teamIdByName.get(team.name);
      return teamId ? [{ teamPoolId, teamId }] : [];
    });

    if (values.length > 0) {
      await db.insert(teamPoolMembers).values(values).onConflictDoNothing();
    }
  }

  console.info(
    `Seed hoàn tất: ${seededTeams.length} đội, ${seededPools.length} nhóm đội.`,
  );
}

seed().catch((error: unknown) => {
  console.error("Seed database thất bại.", error);
  process.exitCode = 1;
});
