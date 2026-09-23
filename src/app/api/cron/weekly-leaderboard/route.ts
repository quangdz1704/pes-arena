import { NextResponse } from "next/server";

import { sendLeaderboardToDiscord } from "@/lib/discord/leaderboard";
import { claimWeeklyLeaderboardReport, finishDiscordReport } from "@/repositories/discord-report.repository";
import { getLeaderboardStartDate } from "@/services/leaderboard";
import { getLeaderboard } from "@/services/leaderboard.service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodStart = getLeaderboardStartDate("SEVEN_DAYS");
  if (!periodStart) return NextResponse.json({ error: "Invalid period" }, { status: 500 });
  const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const report = await claimWeeklyLeaderboardReport(periodStart, periodEnd);
  if (!report) return NextResponse.json({ status: "already_processed" });

  const entries = await getLeaderboard({ period: "SEVEN_DAYS", matchMode: "ALL", sort: "WINS" });
  const result = await sendLeaderboardToDiscord(entries, "Tổng kết 7 ngày qua");
  if (result === "sent" || result === "empty") {
    await finishDiscordReport(report.id, "SENT");
    return NextResponse.json({ status: result });
  }

  await finishDiscordReport(report.id, "FAILED", result);
  return NextResponse.json({ status: result }, { status: 502 });
}
