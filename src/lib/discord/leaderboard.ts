import type { LeaderboardEntry } from "@/services/leaderboard";

export type DiscordLeaderboardResult = "sent" | "not_configured" | "failed" | "empty";

export function createLeaderboardDiscordPayload(entries: LeaderboardEntry[], title: string) {
  const ranking = entries.slice(0, 10).map((entry) =>
    `**${entry.rank}. ${entry.playerName}** — **${entry.points} điểm** · ${entry.wins}W · ${entry.winRate}% WR · GD ${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}`,
  ).join("\n");

  return {
    allowed_mentions: { parse: [] },
    embeds: [{
      title: "🏆 PES ARENA — BẢNG XẾP HẠNG",
      description: `**${title}**\n\n${ranking}`,
      color: 0x6aff94,
      footer: { text: "Chỉ tính trận xếp hạng đã hoàn tất" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function sendLeaderboardToDiscord(entries: LeaderboardEntry[], title: string): Promise<DiscordLeaderboardResult> {
  if (entries.length === 0) return "empty";
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify(createLeaderboardDiscordPayload(entries, title)),
    });
    return response.ok ? "sent" : "failed";
  } catch (error) {
    console.error("Gửi BXH Discord thất bại.", error);
    return "failed";
  }
}
