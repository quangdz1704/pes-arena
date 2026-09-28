import type { LeaderboardEntry } from "@/services/leaderboard";

export type DiscordLeaderboardResult = "sent" | "not_configured" | "failed" | "empty";

export function createLeaderboardDiscordPayload(entries: LeaderboardEntry[], title: string) {
  const ranking = entries.slice(0, 10).map(formatLeaderboardEntry).join("\n\n");

  return {
    allowed_mentions: { parse: [] },
    embeds: [{
      title: "🛡️ PES ARENA — BXH GIAO HỮU",
      description: `**${title}**\n\n${ranking}`,
      color: 0x6aff94,
      footer: { text: "Điểm Arena · chỉ tính trận giao hữu tự tạo đã hoàn tất" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function formatLeaderboardEntry(entry: LeaderboardEntry) {
  const placement = entry.isProvisional
    ? `🧪 **Tạm** **${entry.playerName}** · còn ${Math.max(0, 5 - entry.ratedMatches)} trận để chốt hạng`
    : `${rankIcon(entry.rank)} **#${entry.rank} ${entry.playerName}**`;
  const movement = entry.ratingDelta > 0
    ? `↗ **+${entry.ratingDelta}**`
    : entry.ratingDelta < 0
      ? `↘ **-${Math.abs(entry.ratingDelta)}**`
      : "→ **0**";
  const goalDifference = `${entry.goalDifference > 0 ? "+" : ""}${entry.goalDifference}`;

  return [
    placement,
    `> 🛡️ **${entry.rating.toLocaleString("vi-VN")} Điểm Arena** · ${movement}`,
    `> ${entry.wins} thắng · ${entry.draws} hòa · ${entry.losses} thua · Winrate ${entry.winRate}% · HS ${goalDifference}`,
  ].join("\n");
}

function rankIcon(rank: number) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";
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
