import "server-only";

import { count, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { players, teamPools, teams } from "@/db/schema";

export async function getFoundationSummary() {
  const db = getDb();
  const [playerRows, teamRows, poolRows] = await Promise.all([
    db.select({ value: count() }).from(players).where(eq(players.isActive, true)),
    db.select({ value: count() }).from(teams).where(eq(teams.isActive, true)),
    db
      .select({ value: count() })
      .from(teamPools)
      .where(eq(teamPools.isActive, true)),
  ]);

  return {
    players: playerRows[0]?.value ?? 0,
    teams: teamRows[0]?.value ?? 0,
    pools: poolRows[0]?.value ?? 0,
  };
}
