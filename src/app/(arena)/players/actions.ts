"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import {
  playerInputSchema,
  playerStatusSchema,
  savePlayer,
  setPlayerActive,
} from "@/services/player.service";

export async function savePlayerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const rawId = String(formData.get("id") ?? "").trim();
    const input = playerInputSchema.parse({
      id: rawId || undefined,
      name: formData.get("name"),
      nickname: formData.get("nickname") ?? "",
      avatarUrl: formData.get("avatarUrl") ?? "",
    });

    await savePlayer(input);
    revalidatePath("/players");
    revalidatePath("/");
    return {
      status: "success",
      message: rawId ? "Đã cập nhật người chơi." : "Đã thêm người chơi.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPlayerActiveAction(formData: FormData) {
  const input = playerStatusSchema.parse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  await setPlayerActive(input.id, input.isActive);
  revalidatePath("/players");
  revalidatePath("/");
}
