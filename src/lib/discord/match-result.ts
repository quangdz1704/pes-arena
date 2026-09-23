import type { MatchDetailDto } from "@/repositories/match.repository";

type DiscordResult = "sent" | "not_configured" | "failed";

function captionFor(match: MatchDetailDto) {
  const [sideA, sideB] = match.sides;
  const scoreA = sideA.score ?? 0;
  const scoreB = sideB.score ?? 0;
  const difference = Math.abs(scoreA - scoreB);
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? sideA : sideB;
  const winnerNames = winner?.players.map((player) => player.name).join(" + ");
  const rerolls = sideA.rerollCount + sideB.rerollCount;

  if (scoreA === scoreB) return "Kèo này bất phân thắng bại. Cả hai bên cùng giữ thể diện. 🤝";
  if (rerolls >= 4) return `Quay đội ${rerolls} lần vẫn không quay được số phận. 🤡`;
  if (difference >= 7) return `${winnerNames} vừa phát hành thông báo khẩn cho hàng thủ đối phương. 💀`;
  if (difference >= 4) return `${winnerNames} thắng đậm. VAR đã kiểm tra và xác nhận: vẫn thua.`;
  if (difference === 1) return `${winnerNames} thắng sát nút, nhưng gáy thì chắc chắn không sát nút.`;
  return `${winnerNames} lấy 3 điểm. Đá có hay không thì lịch sử sẽ tự kể.`;
}

function notesFor(match: MatchDetailDto) {
  const playerNameById = new Map(
    match.sides.flatMap((side) => side.players).map((player) => [player.id, player.name]),
  );
  const content = match.notes
    .map((note) => `• **${playerNameById.get(note.playerId) ?? "Tuyển thủ"}:** ${note.content}`)
    .join("\n");

  return content ? content.slice(0, 1024) : "K còn gì để nói.";
}

export async function sendMatchResultToDiscord(match: MatchDetailDto): Promise<DiscordResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";

  const [sideA, sideB] = match.sides;
  const scoreA = sideA.score ?? 0;
  const scoreB = sideB.score ?? 0;
  const modeLabel = match.matchMode === "TWO_V_TWO" ? "KẾT QUẢ 2V2" : "KẾT QUẢ 1V1";
  const sideLabel = (side: typeof sideA) =>
    `${side.players.map((player) => player.name).join(" + ")}\n${side.team?.name ?? "Chưa chọn đội"}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "🏆 PES ARENA",
            description: `⚽ **${modeLabel}**`,
            color: scoreA === scoreB ? 0x60a5fa : 0x6aff94,
            fields: [
              { name: "SIDE A", value: sideLabel(sideA), inline: true },
              { name: "TỈ SỐ", value: `# ${scoreA} - ${scoreB}`, inline: true },
              { name: "SIDE B", value: sideLabel(sideB), inline: true },
              { name: "🤡 PES ARENA NEWS", value: captionFor(match) },
              { name: "💬 Cảm nhận sau trận", value: notesFor(match) },
            ],
            footer: { text: match.isRanked ? "Trận xếp hạng" : "Trận không xếp hạng" },
            timestamp: match.playedAt ?? new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Gửi Discord thất bại.", { status: response.status });
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error("Gửi Discord thất bại.", error);
    return "failed";
  }
}
