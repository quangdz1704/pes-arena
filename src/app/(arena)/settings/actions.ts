"use server";

import { z } from "zod";

import { toActionError } from "@/lib/action-errors";
import type { ActionState } from "@/lib/action-state";
import { sendLeaderboardToDiscord } from "@/lib/discord/leaderboard";
import { getLeaderboard } from "@/services/leaderboard.service";

const periodSchema = z.enum(["SEVEN_DAYS", "THIRTY_DAYS", "ALL"]);

export async function sendLeaderboardAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const period = periodSchema.parse(formData.get("period"));
    const entries = await getLeaderboard({ period, matchMode: "ALL", sort: "WINS" });
    const titleByPeriod = { SEVEN_DAYS: "7 ngày gần nhất", THIRTY_DAYS: "30 ngày gần nhất", ALL: "Toàn thời gian" } as const;
    const result = await sendLeaderboardToDiscord(entries, titleByPeriod[period]);
    const messageByResult = {
      sent: "Đã gửi BXH lên Discord.",
      not_configured: "Discord chưa được cấu hình.",
      failed: "Không gửi được Discord. Bạn có thể thử lại.",
      empty: "Chưa có trận xếp hạng phù hợp để gửi.",
    } as const;
    return { status: result === "sent" ? "success" : "error", message: messageByResult[result] };
  } catch (error) {
    return toActionError(error);
  }
}
