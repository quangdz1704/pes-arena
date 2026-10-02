import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { MatchSetupDto } from "@/repositories/match.repository";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../actions", () => ({ startMatchAction: vi.fn() }));

import { MatchBuilder } from "./match-builder";

const setup: MatchSetupDto = {
  players: [
    { id: "player-a", name: "Cường", nickname: "Cậu", avatarUrl: null },
    { id: "player-b", name: "Quang", nickname: null, avatarUrl: null },
  ],
  pools: [{
    id: "pool", name: "Câu lạc bộ", emoji: null, description: null,
    teams: [
      { id: "team-a", name: "Arsenal", shortName: "ARS", type: "CLUB", tier: "S", country: "England", rating: 90 },
      { id: "team-b", name: "Real Madrid", shortName: "RMA", type: "CLUB", tier: "S", country: "Spain", rating: 91 },
    ],
  }],
  recentTeamIds: [],
};

const fixture = {
  id: "fixture", tournamentId: "tournament", matchId: null,
  homePlayerIds: ["player-a"], awayPlayerIds: ["player-b"],
  homeName: "Cường", awayName: "Quang", matchMode: "ONE_V_ONE" as const,
  teamPoolId: "pool", homeTeamId: "team-a", awayTeamId: "team-b",
};

describe("compact match creation", () => {
  it("keeps random filters and Arena scoring visible for friendly matches", () => {
    const html = renderToStaticMarkup(<MatchBuilder setup={setup} tournamentFixture={null} />);

    expect(html).toContain("Siêu sao · Tier S");
    expect(html).toContain("Hoàn toàn ngẫu nhiên");
    expect(html).toContain("Tất cả giải đấu");
    expect(html).toContain("Tính Điểm Arena");
    expect(html).toContain("Chọn đủ 2 người và 2 đội để bắt đầu.");
    expect(html).not.toContain("Phase 3");
  });

  it("previews assigned tournament teams and hides controls that can change a fixture", () => {
    const html = renderToStaticMarkup(<MatchBuilder setup={setup} tournamentFixture={fixture} />);

    expect(html).toContain("Arsenal");
    expect(html).toContain("Real Madrid");
    expect(html).toContain("VS");
    expect(html).toContain("không tính Điểm Arena hay BXH giao hữu");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("Quay đội bóng");
    expect(html).not.toContain("Đổi cặp");
    expect(html).not.toContain("Chọn đủ 2 người");
  });

  it("keeps team selection available for an unassigned tournament fixture", () => {
    const html = renderToStaticMarkup(<MatchBuilder setup={setup} tournamentFixture={{ ...fixture, teamPoolId: null, homeTeamId: null, awayTeamId: null }} />);

    expect(html).toContain("Quay đội bóng");
    expect(html).toContain("Chọn tay");
    expect(html).toContain("Người chơi đã được chốt");
    expect(html).not.toContain('type="checkbox"');
  });

  it("preserves both teammates on each side of a 2v2 tournament fixture", () => {
    const fourPlayerSetup = {
      ...setup,
      players: [...setup.players,
        { id: "player-c", name: "Hậu", nickname: null, avatarUrl: null },
        { id: "player-d", name: "Bẹc", nickname: null, avatarUrl: null },
      ],
    };
    const html = renderToStaticMarkup(<MatchBuilder setup={fourPlayerSetup} tournamentFixture={{
      ...fixture, matchMode: "TWO_V_TWO",
      homePlayerIds: ["player-a", "player-c"], awayPlayerIds: ["player-b", "player-d"],
    }} />);

    const preview = html.slice(html.indexOf('<aside'));
    expect(preview.indexOf("Cường")).toBeLessThan(preview.indexOf("Hậu"));
    expect(preview.indexOf("Hậu")).toBeLessThan(preview.indexOf("VS"));
    expect(preview.indexOf("VS")).toBeLessThan(preview.indexOf("Quang"));
    expect(preview.indexOf("Quang")).toBeLessThan(preview.indexOf("Bẹc"));
    expect(html).not.toContain("Đổi cặp");
  });

  it("explains missing players and pools instead of allowing an incomplete match", () => {
    const html = renderToStaticMarkup(<MatchBuilder setup={{ players: [], pools: [], recentTeamIds: [] }} tournamentFixture={null} />);

    expect(html).toContain("Cần ít nhất 2 người chơi đang hoạt động");
    expect(html).toContain("Chưa có nhóm đội đang hoạt động");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });
});
