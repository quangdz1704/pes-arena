"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import {
  saveTeamPool,
  setTeamPoolActive,
  teamPoolInputSchema,
  teamPoolStatusSchema,
} from "@/services/team-pool.service";
import {
  saveTeam,
  setTeamActive,
  teamInputSchema,
  teamStatusSchema,
} from "@/services/team.service";

export async function saveTeamAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const rawId = String(formData.get("id") ?? "").trim();
    const input = teamInputSchema.parse({
      id: rawId || undefined,
      name: formData.get("name"),
      shortName: formData.get("shortName"),
      logoUrl: formData.get("logoUrl") ?? "",
      type: formData.get("type"),
      tier: formData.get("tier"),
      country: formData.get("country"),
      rating: formData.get("rating"),
    });

    await saveTeam(input);
    revalidatePath("/teams");
    return {
      status: "success",
      message: rawId ? "Đã cập nhật đội bóng." : "Đã thêm đội bóng.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setTeamActiveAction(formData: FormData) {
  const input = teamStatusSchema.parse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  await setTeamActive(input.id, input.isActive);
  revalidatePath("/teams");
}

export async function saveTeamPoolAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const rawId = String(formData.get("id") ?? "").trim();
    const input = teamPoolInputSchema.parse({
      id: rawId || undefined,
      name: formData.get("name"),
      emoji: formData.get("emoji") ?? "",
      description: formData.get("description") ?? "",
      teamIds: formData.getAll("teamIds"),
    });

    await saveTeamPool(input);
    revalidatePath("/teams");
    return {
      status: "success",
      message: rawId ? "Đã cập nhật nhóm đội." : "Đã tạo nhóm đội.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setTeamPoolActiveAction(formData: FormData) {
  const input = teamPoolStatusSchema.parse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  await setTeamPoolActive(input.id, input.isActive);
  revalidatePath("/teams");
}
