"use server";
import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import { createLeague, createLeagueSchema } from "@/services/tournament.service";
export async function createLeagueAction(_: ActionState, formData: FormData): Promise<ActionState> { try { await createLeague(createLeagueSchema.parse({ name: formData.get("name"), playerIds: formData.getAll("playerIds") })); revalidatePath("/tournaments"); return { status: "success", message: "Đã tạo giải và sinh lịch vòng tròn." }; } catch (error) { return toActionError(error); } }
