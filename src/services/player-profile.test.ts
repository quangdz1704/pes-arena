import { describe, expect, it } from "vitest";

import { buildPlayerProfileStats } from "./player-profile";

describe("player profile stats", () => {
  it("calculates a player's individual record from 2v2 and 1v1 matches", () => {
    const stats = buildPlayerProfileStats("a", [
      { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "a", playerName: "An", side: "A", score: 3 },
      { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "b", playerName: "Bình", side: "A", score: 3 },
      { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "c", playerName: "Chi", side: "B", score: 0 },
      { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "d", playerName: "Dung", side: "B", score: 0 },
      { matchId: "m2", matchMode: "ONE_V_ONE", playedAt: new Date("2026-09-21T12:00:00Z"), playerId: "a", playerName: "An", side: "A", score: 1 },
      { matchId: "m2", matchMode: "ONE_V_ONE", playedAt: new Date("2026-09-21T12:00:00Z"), playerId: "c", playerName: "Chi", side: "B", score: 2 },
    ]);

    expect(stats).toMatchObject({ matches: 2, wins: 1, losses: 1, goalsFor: 4, goalsAgainst: 2, cleanSheets: 1, currentStreak: 0, winRate: 50 });
    expect(stats.radar.map((metric) => metric.label)).toEqual(["Winrate", "Tấn công", "Phòng ngự", "Hiệu số", "Phong độ", "Hoạt động"]);
  });

  it("returns a zeroed profile when the player has not completed a ranked match", () => {
    expect(buildPlayerProfileStats("missing", [])).toMatchObject({ matches: 0, winRate: 0, currentStreak: 0 });
  });
});
