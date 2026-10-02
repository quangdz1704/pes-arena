"use client";

import { Check } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type TournamentPlayerOption = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export function ParticipantChips({
  players,
  selectedIds,
  pairs,
  draftIds,
  isDoubles,
  disabled,
  onToggle,
}: {
  players: TournamentPlayerOption[];
  selectedIds: string[];
  pairs: string[][];
  draftIds: string[];
  isDoubles: boolean;
  disabled: boolean;
  onToggle: (playerId: string) => void;
}) {
  return (
    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto p-0.5">
      {players.map((player) => {
        const pairIndex = isDoubles ? pairs.findIndex((pair) => pair.includes(player.id)) : -1;
        const draftIndex = isDoubles ? draftIds.indexOf(player.id) : -1;
        const selected = isDoubles ? pairIndex >= 0 || draftIndex >= 0 : selectedIds.includes(player.id);
        const locked = isDoubles
          ? pairIndex >= 0 || pairs.length >= 8 || (!selected && draftIds.length >= 2)
          : !selected && selectedIds.length >= 8;
        const tone = draftIndex === 1
          ? "border-sky-400/40 bg-sky-400/10"
          : selected
            ? "border-primary/40 bg-primary/10"
            : "border-transparent bg-background/60 hover:border-border";

        return (
          <button
            aria-pressed={selected}
            className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default ${tone} ${!selected && locked ? "opacity-40" : ""}`}
            disabled={disabled || locked}
            key={player.id}
            onClick={() => onToggle(player.id)}
            type="button"
          >
            <Avatar>
              <AvatarImage alt={player.name} src={player.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs font-semibold">
                {player.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 break-words font-semibold">{player.name}</span>
            {isDoubles && pairIndex >= 0 ? (
              <span className="shrink-0 text-[10px] font-bold text-primary">Cặp {pairIndex + 1}</span>
            ) : isDoubles && draftIndex >= 0 ? (
              <span className={`text-xs font-bold ${draftIndex === 1 ? "text-sky-400" : "text-primary"}`}>{draftIndex + 1}</span>
            ) : selected ? <Check aria-hidden className="size-3.5 shrink-0 text-primary" /> : null}
          </button>
        );
      })}
      {!players.length ? <p className="text-xs text-muted-foreground">Chưa có người chơi đang hoạt động.</p> : null}
    </div>
  );
}
