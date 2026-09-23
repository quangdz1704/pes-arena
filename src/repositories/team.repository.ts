import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { teams } from "@/db/schema";

export type TeamDto = {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  type: "CLUB" | "NATIONAL";
  tier: "S" | "A" | "B" | "C";
  country: string;
  rating: number;
  isActive: boolean;
};

type TeamValues = Pick<
  typeof teams.$inferInsert,
  "name" | "shortName" | "logoUrl" | "type" | "tier" | "country" | "rating"
>;

export async function listTeamRecords(): Promise<TeamDto[]> {
  return getDb()
    .select({
      id: teams.id,
      name: teams.name,
      shortName: teams.shortName,
      logoUrl: teams.logoUrl,
      type: teams.type,
      tier: teams.tier,
      country: teams.country,
      rating: teams.rating,
      isActive: teams.isActive,
    })
    .from(teams)
    .orderBy(desc(teams.isActive), asc(teams.type), desc(teams.rating), asc(teams.name));
}

export async function createTeamRecord(values: TeamValues) {
  const [team] = await getDb().insert(teams).values(values).returning({ id: teams.id });
  return team;
}

export async function updateTeamRecord(id: string, values: TeamValues) {
  const [team] = await getDb()
    .update(teams)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(teams.id, id))
    .returning({ id: teams.id });
  return team;
}

export async function setTeamActiveRecord(id: string, isActive: boolean) {
  const [team] = await getDb()
    .update(teams)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(teams.id, id))
    .returning({ id: teams.id });
  return team;
}
