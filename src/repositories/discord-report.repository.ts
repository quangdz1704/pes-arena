import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { discordReports } from "@/db/schema";

export async function claimWeeklyLeaderboardReport(periodStart: Date, periodEnd: Date) {
  const [report] = await getDb().insert(discordReports).values({ type: "WEEKLY_LEADERBOARD", periodStart, periodEnd, status: "PENDING" }).onConflictDoNothing().returning({ id: discordReports.id });
  return report ?? null;
}

export async function finishDiscordReport(id: string, status: "SENT" | "FAILED", errorMessage?: string) {
  await getDb().update(discordReports).set({ status, errorMessage: errorMessage ?? null, sentAt: status === "SENT" ? new Date() : null, updatedAt: new Date() }).where(eq(discordReports.id, id));
}
