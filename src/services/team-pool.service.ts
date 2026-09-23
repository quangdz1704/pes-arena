import "server-only";

import { z } from "zod";

import {
  listTeamPoolRecords,
  saveTeamPoolRecord,
  setTeamPoolActiveRecord,
} from "@/repositories/team-pool.repository";

export const teamPoolInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Tên nhóm đội quá ngắn.").max(100),
  emoji: z.string().trim().max(16).transform((value) => value || null),
  description: z
    .string()
    .trim()
    .max(300)
    .transform((value) => value || null),
  teamIds: z.array(z.uuid()).max(200),
});

export const teamPoolStatusSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type TeamPoolInput = z.infer<typeof teamPoolInputSchema>;

export async function listTeamPools() {
  return listTeamPoolRecords();
}

export async function saveTeamPool(input: TeamPoolInput) {
  return saveTeamPoolRecord(input);
}

export async function setTeamPoolActive(id: string, isActive: boolean) {
  return setTeamPoolActiveRecord(id, isActive);
}
