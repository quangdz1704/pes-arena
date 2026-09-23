"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Power, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function PlayerManager({ players }: { players: PlayerDto[] }) {
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <Card key={player.id} className="border-white/8 bg-card/80">
          <CardContent className="flex items-center gap-4 py-5">
            <Avatar className="size-12 border border-white/10">
              <AvatarImage src={player.avatarUrl ?? undefined} alt={player.name} />
              <AvatarFallback className="bg-primary/10 font-black text-primary">
                {initials(player.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-bold">{player.name}</h2>
                <Badge variant={player.isActive ? "default" : "secondary"}>
                  {player.isActive ? "Đang chơi" : "Tạm nghỉ"}
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {player.nickname || "Chưa có biệt danh"}
              </p>
            </div>
            <div className="flex items-center">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
