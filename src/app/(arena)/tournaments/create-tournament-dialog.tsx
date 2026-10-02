"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TournamentForm } from "./league-form";
import type { TournamentPlayerOption } from "./participant-chips";

type TeamOption = { id: string; name: string; shortName: string; tier: "S" | "A" | "B" | "C"; rating: number };
type PoolOption = { id: string; name: string; emoji: string | null; teams: TeamOption[] };

export function CreateTournamentDialog({ players, pools }: { players: TournamentPlayerOption[]; pools: PoolOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl px-4 font-black" size="lg">
          <Plus />
          Tạo giải
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-4 pr-12">
          <DialogTitle className="text-xl font-black">Tạo giải mới</DialogTitle>
          <DialogDescription>
            Chọn người chơi, Arena lo lịch thi đấu.
          </DialogDescription>
        </DialogHeader>
        <TournamentForm onSuccess={() => setOpen(false)} players={players} pools={pools} />
      </DialogContent>
    </Dialog>
  );
}
