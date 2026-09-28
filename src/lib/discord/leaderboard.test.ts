import { describe, expect, it } from "vitest";

import { createLeaderboardDiscordPayload } from "./leaderboard";

describe("leaderboard Discord payload", () => {
  it("renders Arena points and movement without allowing mentions", () => {
    const payload = createLeaderboardDiscordPayload([{ rank: 1, playerId: "a", playerName: "Quang", avatarUrl: null, matches: 5, ratedMatches: 5, wins: 4, draws: 0, losses: 1, points: 12, rating: 1088, ratingDelta: 24, isProvisional: false, winRate: 80, goalsFor: 15, goalsAgainst: 7, goalDifference: 8, currentStreak: 2 }], "7 ngày gần nhất");
    expect(payload.allowed_mentions).toEqual({ parse: [] });
    expect(payload.embeds[0]?.title).toBe("🛡️ PES ARENA — BXH GIAO HỮU");
    expect(payload.embeds[0]?.description).toContain("🥇 **#1 Quang**");
    expect(payload.embeds[0]?.description).toContain("**1.088 Điểm Arena** · ↗ **+24**");
    expect(payload.embeds[0]?.description).toContain("4 thắng · 0 hòa · 1 thua · Winrate 80% · HS +8");
    expect(payload.embeds[0]?.description).not.toContain("rating");
  });

  it("labels provisional players without showing rank zero", () => {
    const payload = createLeaderboardDiscordPayload([{ rank: 0, playerId: "b", playerName: "Cường", avatarUrl: null, matches: 3, ratedMatches: 3, wins: 2, draws: 1, losses: 0, points: 7, rating: 1031, ratingDelta: -31, isProvisional: true, winRate: 67, goalsFor: 5, goalsAgainst: 2, goalDifference: 3, currentStreak: 2 }], "Tổng kết 7 ngày qua");
    const description = payload.embeds[0]?.description ?? "";

    expect(description).toContain("🧪 **Tạm** **Cường** · còn 2 trận để chốt hạng");
    expect(description).toContain("**1.031 Điểm Arena** · ↘ **-31**");
    expect(description).not.toContain("#0");
  });
});
