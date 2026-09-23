import { describe, expect, it } from "vitest";

import { buildLeaderboard, getLeaderboardStartDate } from "./leaderboard";

describe("leaderboard", () => {
  it("calculates each 2v2 participant's result from their side score", () => {
    const entries = buildLeaderboard(
      [
        { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "a", playerName: "An", side: "A", score: 4 },
        { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "b", playerName: "Bình", side: "A", score: 4 },
        { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "c", playerName: "Chi", side: "B", score: 2 },
        { matchId: "m1", matchMode: "TWO_V_TWO", playedAt: new Date("2026-09-20T12:00:00Z"), playerId: "d", playerName: "Dung", side: "B", score: 2 },
      ],
      "WINS",
    );

    expect(entries[0]).toMatchObject({ playerId: "a", wins: 1, goalsFor: 4, goalsAgainst: 2, currentStreak: 1 });
    expect(entries.find((entry) => entry.playerId === "c")).toMatchObject({ losses: 1, goalsFor: 2, goalsAgainst: 4, currentStreak: 0 });
  });

  it("uses the start of the Vietnam day for rolling day filters", () => {
    expect(getLeaderboardStartDate("DAY", new Date("2026-09-20T18:00:00Z"))?.toISOString()).toBe("2026-09-20T17:00:00.000Z");
    expect(getLeaderboardStartDate("SEVEN_DAYS", new Date("2026-09-20T18:00:00Z"))?.toISOString()).toBe("2026-09-14T17:00:00.000Z");
  });
});
