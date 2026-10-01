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

type PlayerOption = { id: string; name: string };
type TeamOption = { id: string; name: string; shortName: string; tier: "S" | "A" | "B" | "C"; rating: number };
type PoolOption = { id: string; name: string; emoji: string | null; teams: TeamOption[] };

export function CreateTournamentDialog({ players, pools }: { players: PlayerOption[]; pools: PoolOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl px-4 font-black" size="lg">
          <Plus />
          Tạo giải
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-3xl">
        <DialogHeader className="pr-9">
          <DialogTitle className="text-xl font-black">Tạo giải mới</DialogTitle>
          <DialogDescription>
            Chọn thể thức, người chơi và PES Arena sẽ tự sinh lịch thi đấu.
          </DialogDescription>
        </DialogHeader>
        <TournamentForm onSuccess={() => setOpen(false)} players={players} pools={pools} />
      </DialogContent>
    </Dialog>
  );
}
