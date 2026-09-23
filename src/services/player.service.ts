import "server-only";

import { z } from "zod";

import {
  createPlayerRecord,
  listPlayerRecords,
  setPlayerActiveRecord,
  updatePlayerRecord,
} from "@/repositories/player.repository";

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

export async function savePlayer(input: PlayerInput) {
  const { id, ...values } = input;
  return id ? updatePlayerRecord(id, values) : createPlayerRecord(values);
}

export async function setPlayerActive(id: string, isActive: boolean) {
  return setPlayerActiveRecord(id, isActive);
}
