import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { players } from "@/db/schema";

export type PlayerDto = {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

type PlayerValues = Pick<
  typeof players.$inferInsert,
  "name" | "nickname" | "avatarUrl"
>;

export async function listPlayerRecords(): Promise<PlayerDto[]> {
  const rows = await getDb()
    .select()
    .from(players)
    .orderBy(desc(players.isActive), asc(players.name));

  return rows.map((player) => ({
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl,
    isActive: player.isActive,
    createdAt: player.createdAt.toISOString(),
  }));
}

export async function createPlayerRecord(values: PlayerValues) {
  const [player] = await getDb().insert(players).values(values).returning({
    id: players.id,
  });
  return player;
}

export async function updatePlayerRecord(id: string, values: PlayerValues) {
  const [player] = await getDb()
    .update(players)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(players.id, id))
    .returning({ id: players.id });
  return player;
}

export async function setPlayerActiveRecord(id: string, isActive: boolean) {
  const [player] = await getDb()
    .update(players)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(players.id, id))
    .returning({ id: players.id });
  return player;
}
