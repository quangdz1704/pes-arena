"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Crown, Pencil, Plus, Power, Search, Swords, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import type { PlayerDto } from "@/repositories/player.repository";
import type { PlayerRosterEntry } from "@/services/player.service";

import { savePlayerAction, setPlayerActiveAction } from "./actions";

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full font-bold">
      {pending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm người chơi"}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-xs text-destructive">{errors[0]}</p> : null;
}

function PlayerDialog({ player }: { player?: PlayerDto }) {
  const [state, action] = useActionState(savePlayerAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {player ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${player.name}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="h-11 rounded-xl font-bold">
            <Plus className="size-4" /> Thêm người chơi
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{player ? "Sửa người chơi" : "Thêm người chơi"}</DialogTitle>
          <DialogDescription>
            Tên sẽ xuất hiện trong trận đấu, lịch sử và bảng xếp hạng.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={player?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor={`name-${player?.id ?? "new"}`}>Tên hiển thị</Label>
            <Input
              id={`name-${player?.id ?? "new"}`}
              name="name"
              defaultValue={player?.name}
              placeholder="Ví dụ: Quang"
              required
              maxLength={100}
            />
            <FieldError errors={state.fieldErrors?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`nickname-${player?.id ?? "new"}`}>Biệt danh</Label>
            <Input
              id={`nickname-${player?.id ?? "new"}`}
              name="nickname"
              defaultValue={player?.nickname ?? ""}
              placeholder="Ví dụ: Máy pressing"
              maxLength={100}
            />
            <FieldError errors={state.fieldErrors?.nickname} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`avatar-${player?.id ?? "new"}`}>URL avatar</Label>
            <Input
              id={`avatar-${player?.id ?? "new"}`}
              name="avatarUrl"
              type="url"
              defaultValue={player?.avatarUrl ?? ""}
              placeholder="https://..."
              maxLength={500}
            />
            <FieldError errors={state.fieldErrors?.avatarUrl} />
          </div>
          {state.status === "error" ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <SubmitButton editing={Boolean(player)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddPlayerButton() {
  return <PlayerDialog />;
}

export function PlayerManager({ players }: { players: PlayerRosterEntry[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const filteredPlayers = players.filter((player) =>
    [player.name, player.nickname]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery)),
  );

  if (players.length === 0) {
    return (
      <Card className="border-dashed bg-transparent">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <UserRound className="mb-4 size-10 text-muted-foreground" />
          <h2 className="font-bold">Chưa có ai để chia kèo.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm người chơi đầu tiên để chuẩn bị cho trận 1v1 hoặc 2v2.
          </p>
          <div className="mt-5"><PlayerDialog /></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Tìm người chơi"
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên hoặc biệt danh..."
          value={query}
        />
      </div>
      {normalizedQuery ? (
        <p className="text-sm text-muted-foreground">
          Tìm thấy {filteredPlayers.length}/{players.length} người chơi.
        </p>
      ) : null}
      {filteredPlayers.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Không tìm thấy người chơi phù hợp.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="group relative isolate min-h-[450px] overflow-hidden border-white/12 bg-[#101419] transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
              {player.avatarUrl ? (
                <>
                  {/* Avatar URLs are user-managed and may use arbitrary validated hosts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img aria-hidden alt="" className="player-card-avatar-art absolute -inset-16 size-[calc(100%+8rem)] object-cover object-top opacity-25" src={player.avatarUrl} />
                </>
              ) : null}
              <div aria-hidden className="player-card-grid absolute inset-0 opacity-60" />
              <div aria-hidden className="absolute -right-14 -top-12 size-48 rounded-full bg-primary/12 blur-3xl transition duration-500 group-hover:bg-primary/20" />
              <CardContent className="relative flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-4xl font-black leading-none tracking-tighter text-primary">{player.points}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Điểm arena</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-sm">
                    <PlayerDialog player={player} />
                    <form action={setPlayerActiveAction}>
                      <input type="hidden" name="id" value={player.id} />
                      <input type="hidden" name="isActive" value={String(!player.isActive)} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={player.isActive ? `Tạm ẩn ${player.name}` : `Bật ${player.name}`}
                        className={player.isActive ? "text-muted-foreground" : "text-primary"}
                      >
                        <Power className="size-4" />
                      </Button>
                    </form>
                  </div>
                </div>

                <Link href={`/players/${player.id}`} className="mt-2 flex flex-1 flex-col items-center text-center outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="relative -mx-4 h-56 w-[calc(100%+2rem)]">
                    {player.avatarUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={player.name} className="player-card-portrait absolute inset-0 size-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" src={player.avatarUrl} />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-primary/10 to-transparent">
                        <span className="text-8xl font-black tracking-tighter text-primary/85">{initials(player.name)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 min-w-0">
                    <h2 className="truncate text-2xl font-black tracking-tight group-hover:text-primary">{player.name}</h2>
                    <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{player.nickname || "Arena contender"}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Badge variant={player.isActive ? "default" : "secondary"}>{player.isActive ? "Đang thi đấu" : "Tạm nghỉ"}</Badge>
                    <Badge variant="outline" className="border-white/12 bg-background/35 text-foreground">Hạng #{player.rank}</Badge>
                  </div>
                </Link>

                <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20 py-3 text-center">
                  <CardStat label="Trận" value={player.stats.matches} />
                  <CardStat label="Thắng" value={player.stats.wins} tone="text-primary" />
                  <CardStat label="Winrate" value={`${player.stats.winRate}%`} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Crown className="size-3.5 text-primary" /> Hồ sơ chiến hữu</span>
                  <span className={player.stats.currentStreak > 0 ? "flex items-center gap-1 text-primary" : "flex items-center gap-1"}><Swords className="size-3.5" /> {player.stats.currentStreak > 0 ? `${player.stats.currentStreak}W` : "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CardStat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return <div className="px-2"><p className={`text-lg font-black ${tone ?? ""}`}>{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}
