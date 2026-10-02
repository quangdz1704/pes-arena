import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TournamentCarousel } from "./tournament-carousel";

const item = {
  id: "cup", name: "All star", type: "LEAGUE" as const,
  matchMode: "ONE_V_ONE" as const, status: "ACTIVE" as const,
  competitors: 4, fixtures: 6, createdAt: "2026-10-01T00:00:00Z",
  leaders: {
    label: "Top giải · Tạm thời",
    entries: [
      { id: "c1", name: "Cường", seed: 1, rank: 1, points: 4, players: [{ id: "p1", name: "Cường", avatarUrl: null }] },
      { id: "c2", name: "Quang", seed: 2, rank: 2, points: 3, players: [{ id: "p2", name: "Quang", avatarUrl: null }] },
    ],
  },
};

describe("tournament carousel leader chips", () => {
  it("renders ordered ranks, avatar chips and points beside the tournament summary", () => {
    const html = renderToStaticMarkup(<TournamentCarousel items={[item]} />);
    expect(html).toContain("Top giải · Tạm thời");
    expect(html).toContain("#1");
    expect(html).toContain("#2");
    expect(html).toContain("4đ");
    expect(html.indexOf("Cường")).toBeLessThan(html.indexOf("Quang"));
    expect(html.match(/data-slot="avatar"/g)).toHaveLength(2);
    expect(html).toContain("Tiếp tục giải");
    expect(html).toContain('aria-label="Giải tiếp theo"');
  });

  it("renders both doubles avatars and correctly preserves joint third places", () => {
    const html = renderToStaticMarkup(<TournamentCarousel items={[{
      ...item, type: "KNOCKOUT", status: "FINISHED", matchMode: "TWO_V_TWO",
      leaders: { label: "Top giải · Chung cuộc", entries: [
        { ...item.leaders.entries[0], name: "Cường + Hậu", rank: 3, points: null, players: [...item.leaders.entries[0].players, { id: "p3", name: "Hậu", avatarUrl: null }] },
        { ...item.leaders.entries[1], rank: 3, points: null },
      ] },
    }]} />);
    expect(html.match(/#3/g)).toHaveLength(2);
    expect(html.match(/data-slot="avatar"/g)).toHaveLength(3);
    expect(html).not.toContain("3đ");
    expect(html).toContain("Cường + Hậu");
  });

  it("does not show contender order as final standings", () => {
    const html = renderToStaticMarkup(<TournamentCarousel items={[{
      ...item, type: "KNOCKOUT",
      leaders: { label: "Đang tranh cúp", entries: item.leaders.entries.map((entry) => ({ ...entry, rank: null, points: null })) },
    }]} />);
    expect(html).toContain("Đang tranh cúp");
    expect(html).not.toContain("#1");
    expect(html).not.toContain("4đ");
    expect(html).toContain("xếp theo hạt giống");
  });

  it("omits an empty leader section and handles an empty carousel", () => {
    const html = renderToStaticMarkup(<TournamentCarousel items={[{ ...item, leaders: { label: "Giải đã hủy", entries: [] } }]} />);
    expect(html).not.toContain("Giải đã hủy");
    expect(renderToStaticMarkup(<TournamentCarousel items={[]} />)).toBe("");
  });
});
