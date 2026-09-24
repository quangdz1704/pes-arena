import { describe, expect, it } from "vitest";

import { createLeaderboardDiscordPayload } from "./leaderboard";

describe("leaderboard Discord payload", () => {
  it("renders the top entries without allowing mentions", () => {
    const payload = createLeaderboardDiscordPayload([{ rank: 1, playerId: "a", playerName: "Quang", matches: 5, wins: 4, draws: 0, losses: 1, points: 12, winRate: 80, goalsFor: 15, goalsAgainst: 7, goalDifference: 8, currentStreak: 2 }], "7 ngày gần nhất");
    expect(payload.allowed_mentions).toEqual({ parse: [] });
    expect(payload.embeds[0]?.description).toContain("1. Quang");
  });
});
