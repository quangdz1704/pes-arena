"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Layers3, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import type { TeamPoolDto } from "@/repositories/team-pool.repository";
import type { TeamDto } from "@/repositories/team.repository";

import {
  saveTeamAction,
  saveTeamPoolAction,
  setTeamActiveAction,
  setTeamPoolActiveAction,
} from "./actions";

function FormMessage({
  state,
}: {
  state: { status: string; message?: string; fieldErrors?: Record<string, string[]> };
}) {
  return state.status === "error" ? (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.message}
    </p>
  ) : null;
}

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full font-bold">
      {pending ? "Đang lưu..." : children}
    </Button>
  );
}

function TeamLogo({ team }: { team: TeamDto }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!team.logoUrl || hasImageError) {
    return (
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 font-black text-primary">
        {team.shortName.slice(0, 3)}
      </div>
    );
  }

  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 p-1.5">
      {/* Team administrators can enter a logo URL from any public host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={team.logoUrl}
        alt={`Logo ${team.name}`}
        width={44}
        height={44}
        className="size-full object-contain"
        loading="lazy"
        onError={() => setHasImageError(true)}
      />
    </div>
  );
}

function TeamDialog({ team }: { team?: TeamDto }) {
  const [state, action] = useActionState(saveTeamAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {team ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${team.name}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" className="rounded-xl font-bold">
            <Plus className="size-4" /> Thêm đội
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? "Sửa đội bóng" : "Thêm đội bóng"}</DialogTitle>
          <DialogDescription>
            Rating và tier được dùng để random hai đội cân bằng.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={team?.id ?? ""} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`team-name-${team?.id ?? "new"}`}>Tên đội</Label>
            <Input
              id={`team-name-${team?.id ?? "new"}`}
              name="name"
              defaultValue={team?.name}
              required
              maxLength={120}
              placeholder="Manchester United"
            />
          </div>
          <div className="space-y-2">
            <Label>Tên viết tắt</Label>
            <Input name="shortName" defaultValue={team?.shortName} required maxLength={12} />
          </div>
          <div className="space-y-2">
            <Label>Quốc gia</Label>
            <Input name="country" defaultValue={team?.country} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select name="type" defaultValue={team?.type ?? "CLUB"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CLUB">Câu lạc bộ</SelectItem>
                <SelectItem value="NATIONAL">Đội tuyển</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select name="tier" defaultValue={team?.tier ?? "A"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["S", "A", "B", "C"] as const).map((tier) => (
                  <SelectItem key={tier} value={tier}>Tier {tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Rating ({team?.rating ?? 85})</Label>
            <Input name="rating" type="number" min={1} max={100} defaultValue={team?.rating ?? 85} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>URL logo</Label>
            <Input name="logoUrl" type="url" defaultValue={team?.logoUrl ?? ""} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2"><FormMessage state={state} /></div>
          <div className="sm:col-span-2"><SubmitButton>{team ? "Lưu đội bóng" : "Thêm đội bóng"}</SubmitButton></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PoolDialog({ pool, teams }: { pool?: TeamPoolDto; teams: TeamDto[] }) {
  const [state, action] = useActionState(saveTeamPoolAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    }
  }, [state]);

  const selected = new Set(pool?.teamIds ?? []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {pool ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${pool.name}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="rounded-xl font-bold"><Plus className="size-4" /> Tạo nhóm đội</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pool ? "Sửa nhóm đội" : "Tạo nhóm đội"}</DialogTitle>
          <DialogDescription>
            Nhóm đội nằm trong database và sẽ được dùng trực tiếp ở bước random.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={pool?.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
            <div className="space-y-2">
              <Label>Emoji</Label>
              <Input name="emoji" defaultValue={pool?.emoji ?? "🎲"} maxLength={16} />
            </div>
            <div className="space-y-2">
              <Label>Tên nhóm</Label>
              <Input name="name" defaultValue={pool?.name} required maxLength={100} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea name="description" defaultValue={pool?.description ?? ""} maxLength={300} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Đội trong nhóm</Label>
              <span className="text-xs text-muted-foreground">{teams.length} đội có thể chọn</span>
            </div>
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-white/8 bg-background/40 p-3 sm:grid-cols-2">
              {teams.map((team) => (
                <label key={team.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white/5">
                  <Checkbox
                    name="teamIds"
                    value={team.id}
                    defaultChecked={selected.has(team.id)}
                  />
                  <span className="min-w-0 flex-1 truncate">{team.name}</span>
                  <Badge variant="outline">{team.tier}</Badge>
                </label>
              ))}
            </div>
          </div>
          <FormMessage state={state} />
          <SubmitButton>{pool ? "Lưu nhóm đội" : "Tạo nhóm đội"}</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamManager({ teams, pools }: { teams: TeamDto[]; pools: TeamPoolDto[] }) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Nhóm đội</h2>
            <p className="text-sm text-muted-foreground">Pool động cho random thuần và random cân bằng.</p>
          </div>
          <PoolDialog teams={teams} />
        </div>
        {pools.length === 0 ? (
          <Card className="border-dashed bg-transparent"><CardContent className="py-10 text-center text-sm text-muted-foreground">Chưa có nhóm đội nào.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {pools.map((pool) => (
              <Card key={pool.id} className="border-white/8 bg-card/80">
                <CardHeader className="flex-row items-start justify-between pb-2">
                  <div>
                    <div className="text-2xl">{pool.emoji ?? "🎲"}</div>
                    <CardTitle className="mt-2 text-base">{pool.name}</CardTitle>
                  </div>
                  <div className="flex">
                    <PoolDialog pool={pool} teams={teams} />
                    <form action={setTeamPoolActiveAction}>
                      <input type="hidden" name="id" value={pool.id} />
                      <input type="hidden" name="isActive" value={String(!pool.isActive)} />
                      <Button type="submit" variant="ghost" size="icon-sm" aria-label="Đổi trạng thái nhóm đội"><Power className="size-4" /></Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{pool.description || "Chưa có mô tả."}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><Layers3 className="size-3.5" /> {pool.teamIds.length} đội</span>
                    <Badge variant={pool.isActive ? "default" : "secondary"}>{pool.isActive ? "Đang dùng" : "Đã ẩn"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Kho đội bóng</h2>
            <p className="text-sm text-muted-foreground">{teams.length} đội, sắp xếp theo rating.</p>
          </div>
          <TeamDialog />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="border-white/8 bg-card/80">
              <CardContent className="flex items-center gap-3 py-4">
                <TeamLogo team={team} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="truncate font-bold">{team.name}</h3><Badge variant="outline">{team.tier}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{team.type === "CLUB" ? "CLB" : "Đội tuyển"} · {team.country} · {team.rating}</p>
                </div>
                <div className="flex items-center">
                  <TeamDialog team={team} />
                  <form action={setTeamActiveAction}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="isActive" value={String(!team.isActive)} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Đổi trạng thái đội" className={team.isActive ? "text-muted-foreground" : "text-primary"}><Power className="size-4" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
