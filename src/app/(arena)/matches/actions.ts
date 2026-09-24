"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import {
  finishMatch,
  finishMatchInputSchema,
  startMatch,
  startMatchInputSchema,
  updateMatchScoreInputSchema,
  updatePlayingMatchScore,
} from "@/services/match.service";

export type MatchActionState = ActionState & { matchId?: string };

export async function startMatchAction(
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  try {
    const rawPayload = formData.get("payload");
    const payload = JSON.parse(String(rawPayload ?? "")) as unknown;
    const input = startMatchInputSchema.parse(payload);
    const match = await startMatch(input);

    revalidatePath("/");
    revalidatePath("/history");
    revalidatePath("/tournaments");
    return { status: "success", matchId: match.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMatchScoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = updateMatchScoreInputSchema.parse({
      matchId: formData.get("matchId"),
      sideAScore: formData.get("sideAScore"),
      sideBScore: formData.get("sideBScore"),
    });
    await updatePlayingMatchScore(input);
    revalidatePath("/");
    revalidatePath(`/matches/${input.matchId}`);
    return { status: "success", message: "Đã cập nhật tỉ số live." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveMatchScoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = finishMatchInputSchema.parse({
      matchId: formData.get("matchId"),
      sideAScore: formData.get("sideAScore"),
      sideBScore: formData.get("sideBScore"),
      notes: JSON.parse(String(formData.get("notes") ?? "[]")) as unknown,
    });
    const result = await finishMatch(input);

    revalidatePath("/");
    revalidatePath("/history");
    revalidatePath(`/matches/${input.matchId}`);
    if (result.match.tournamentId) revalidatePath(`/tournaments/${result.match.tournamentId}`);
    const messageByDiscordStatus = {
      sent: "Đã lưu kết quả và gửi Discord.",
      not_configured: "Đã lưu kết quả. Discord chưa được cấu hình.",
      failed: "Đã lưu kết quả nhưng gửi Discord thất bại.",
    } as const;
    return { status: "success", message: messageByDiscordStatus[result.discordStatus] };
  } catch (error) {
    return toActionError(error);
  }
}
