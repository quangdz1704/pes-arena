"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import { cancelTournament, createKnockout, createKnockoutSchema, createLeague, createLeagueSchema } from "@/services/tournament.service";

export async function createTournamentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const competitors = JSON.parse(String(formData.get("competitors") ?? "[]")) as unknown;
    const input = {
      name: formData.get("name"),
      matchMode: formData.get("matchMode"),
      competitors,
    };
    const type = z.enum(["LEAGUE", "KNOCKOUT"]).parse(formData.get("type"));
    if (type === "KNOCKOUT") await createKnockout(createKnockoutSchema.parse(input));
    else await createLeague(createLeagueSchema.parse(input));
    revalidatePath("/tournaments");
    return { status: "success", message: type === "KNOCKOUT" ? "Đã tạo bracket knockout." : "Đã tạo giải và sinh lịch vòng tròn." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelTournamentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await cancelTournament(String(formData.get("tournamentId") ?? ""));
    revalidatePath("/tournaments");
    return { status: "success", message: "Đã huỷ giải. Kết quả các trận đã đá vẫn được lưu." };
  } catch (error) {
    return toActionError(error);
  }
}
