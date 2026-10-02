import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ParticipantChips, type TournamentPlayerOption } from "./participant-chips";

const players: TournamentPlayerOption[] = Array.from({ length: 9 }, (_, index) => ({
  id: String(index), name: `Người ${index}`, avatarUrl: null,
}));
const defaults = {
  players, selectedIds: [], pairs: [], draftIds: [],
  isDoubles: false, disabled: false, onToggle: vi.fn(),
};
const buttons = (html: string) => html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];

describe("tournament participant chips", () => {
  it("shows avatar fallbacks and selection state for individual entrants", () => {
    const html = renderToStaticMarkup(<ParticipantChips {...defaults} selectedIds={["0"]} />);
    const chips = buttons(html);

    expect(chips).toHaveLength(9);
    expect(chips[0]).toContain('aria-pressed="true"');
    expect(chips[0]).toContain('data-slot="avatar"');
    expect(chips[0]).toContain('data-slot="avatar-fallback"');
    expect(chips[1]).toContain('aria-pressed="false"');
    expect(chips[0]).not.toContain('disabled=""');
  });

  it("caps individual selection at eight while allowing selected players to be removed", () => {
    const chips = buttons(renderToStaticMarkup(<ParticipantChips {...defaults} selectedIds={players.slice(0, 8).map((player) => player.id)} />));

    expect(chips[0]).not.toContain('disabled=""');
    expect(chips[8]).toContain('disabled=""');
  });

  it("labels confirmed pairs and keeps their players unavailable for another pair", () => {
    const chips = buttons(renderToStaticMarkup(<ParticipantChips {...defaults} isDoubles pairs={[["0", "1"], ["2", "3"]]} />));

    expect(chips[0]).toContain("Cặp 1");
    expect(chips[1]).toContain("Cặp 1");
    expect(chips[2]).toContain("Cặp 2");
    expect(chips[3]).toContain("Cặp 2");
    expect(chips[0]).toContain('disabled=""');
    expect(chips[4]).not.toContain('disabled=""');
  });

  it("marks two draft teammates distinctly and prevents selecting a third", () => {
    const chips = buttons(renderToStaticMarkup(<ParticipantChips {...defaults} isDoubles draftIds={["0", "1"]} />));

    expect(chips[0]).toContain('aria-pressed="true"');
    expect(chips[1]).toContain('aria-pressed="true"');
    expect(chips[0]).toContain("border-primary/40");
    expect(chips[1]).toContain("border-sky-400/40");
    expect(chips[0]).not.toContain('disabled=""');
    expect(chips[1]).not.toContain('disabled=""');
    expect(chips[2]).toContain('disabled=""');
  });

  it("disables the picker while submitting", () => {
    const chips = buttons(renderToStaticMarkup(<ParticipantChips {...defaults} disabled />));
    expect(chips.every((chip) => chip.includes('disabled=""'))).toBe(true);
  });

  it("explains an empty player list", () => {
    const html = renderToStaticMarkup(<ParticipantChips {...defaults} players={[]} />);
    expect(html).toContain("Chưa có người chơi đang hoạt động.");
    expect(buttons(html)).toHaveLength(0);
  });
});
