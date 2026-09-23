import "server-only";

import { z } from "zod";

import {
  createTeamRecord,
  listTeamRecords,
  setTeamActiveRecord,
  updateTeamRecord,
} from "@/repositories/team.repository";

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL quá dài.")
  .refine((value) => value === "" || z.url().safeParse(value).success, {
    message: "URL logo không hợp lệ.",
  })
  .transform((value) => value || null);

export const teamInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(2).max(12).transform((value) => value.toUpperCase()),
  logoUrl: optionalUrl,
  type: z.enum(["CLUB", "NATIONAL"]),
  tier: z.enum(["S", "A", "B", "C"]),
  country: z.string().trim().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(100),
});

export const teamStatusSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type TeamInput = z.infer<typeof teamInputSchema>;

export async function listTeams() {
  return listTeamRecords();
}

export async function saveTeam(input: TeamInput) {
  const { id, ...values } = input;
  return id ? updateTeamRecord(id, values) : createTeamRecord(values);
}

export async function setTeamActive(id: string, isActive: boolean) {
  return setTeamActiveRecord(id, isActive);
}
