import { describe, expect, it } from "vitest";

import { buildArenaNews } from "./arena-news";

describe("arena news", () => {
  it("mixes friendly results with a completed tournament champion in recency order", () => {
    const news = buildArenaNews({
      matches: [{ id: "friendly-1", tournament: null, isRanked: true, playedAt: "2026-09-24T10:00:00.000Z", sides: [{ score: 3, players: [{ name: "Quang" }] }, { score: 0, players: [{ name: "Cường" }] }] }],
      tournaments: [{ id: "cup-1", name: "Cúp Trung Thu", type: "KNOCKOUT", status: "FINISHED", updatedAt: new Date("2026-09-25T10:00:00.000Z"), competitors: [{ id: "a", name: "Cường", seed: 1 }, { id: "b", name: "Quang", seed: 2 }], fixtures: [{ round: 1, homeCompetitorId: "a", awayCompetitorId: "b", matchStatus: "FINISHED", homeScore: 2, awayScore: 1 }] }],
    });

    expect(news).toHaveLength(2);
    expect(news[0]).toMatchObject({ kind: "TOURNAMENT", headline: "Cường lên ngôi Cúp Trung Thu, ai còn dám cãi?" });
    expect(news[1]).toMatchObject({ kind: "FRIENDLY", headline: "Quang thị uy 3–0, Cường chỉ biết nghe tiếng gáy", detail: "Giao hữu · tính Điểm Arena" });
  });
});
