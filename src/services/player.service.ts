import "server-only";

import { z } from "zod";

import {
  createPlayerRecord,
  getPlayerRecord,
  listPlayerRecords,
  setPlayerActiveRecord,
  updatePlayerRecord,
} from "@/repositories/player.repository";
import { listLeaderboardMatchRows } from "@/repositories/match.repository";

import { buildPlayerProfileStats } from "./player-profile";

export type PlayerRosterEntry = Awaited<ReturnType<typeof listPlayers>>[number] & {
  points: number;
  rank: number;
  stats: ReturnType<typeof buildPlayerProfileStats>;
};

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL quá dài.")
  .refine((value) => value === "" || z.url().safeParse(value).success, {
    message: "URL avatar không hợp lệ.",
  })
  .transform((value) => value || null);

export const playerInputSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Tên cần ít nhất 2 ký tự.")
    .max(100, "Tên tối đa 100 ký tự."),
  nickname: z
    .string()
    .trim()
    .max(100, "Biệt danh tối đa 100 ký tự.")
    .transform((value) => value || null),
  avatarUrl: optionalUrl,
});

export const playerStatusSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type PlayerInput = z.infer<typeof playerInputSchema>;

export async function listPlayers() {
  return listPlayerRecords();
}

export async function listPlayersWithStats(): Promise<PlayerRosterEntry[]> {
  const [players, rows] = await Promise.all([
    listPlayerRecords(),
    listLeaderboardMatchRows({ matchMode: "ALL", startDate: null }),
  ]);
  const entries = players.map((player) => {
    const stats = buildPlayerProfileStats(player.id, rows);
    return { ...player, stats, points: stats.wins * 3 + stats.draws };
  });
  const ranks = new Map(
    [...entries]
      .sort((left, right) => right.points - left.points || right.stats.wins - left.stats.wins || right.stats.goalsFor - left.stats.goalsFor)
      .map((entry, index) => [entry.id, index + 1]),
  );

  return entries.map((entry) => ({ ...entry, rank: ranks.get(entry.id) ?? 0 }));
}

export async function getPlayer(id: string) {
  return getPlayerRecord(id);
}

export async function getPlayerProfile(id: string) {
  const [player, rows] = await Promise.all([
    getPlayerRecord(id),
    listLeaderboardMatchRows({ matchMode: "ALL", startDate: null }),
  ]);
  return player ? { player, stats: buildPlayerProfileStats(player.id, rows) } : null;
}

export async function savePlayer(input: PlayerInput) {
  const { id, ...values } = input;
  return id ? updatePlayerRecord(id, values) : createPlayerRecord(values);
}

export async function setPlayerActive(id: string, isActive: boolean) {
  return setPlayerActiveRecord(id, isActive);
}
