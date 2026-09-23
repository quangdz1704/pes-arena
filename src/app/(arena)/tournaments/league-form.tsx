"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";

import { createLeagueAction } from "./actions";

type PlayerOption = { id: string; name: string };
type MatchMode = "ONE_V_ONE" | "TWO_V_TWO";

export function LeagueForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>("ONE_V_ONE");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [pairs, setPairs] = useState<string[][]>([]);
  const [firstPlayerId, setFirstPlayerId] = useState("");
  const [secondPlayerId, setSecondPlayerId] = useState("");
  const [state, action] = useActionState(createLeagueAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    }
    if (state.status === "error") toast.error(state.message);
  }, [router, state]);

  const usedPlayerIds = mode === "ONE_V_ONE" ? selectedPlayerIds : pairs.flat();
  const competitors = mode === "ONE_V_ONE" ? selectedPlayerIds.map((id) => [id]) : pairs;
  const canAddPair = Boolean(firstPlayerId && secondPlayerId && firstPlayerId !== secondPlayerId && !usedPlayerIds.includes(firstPlayerId) && !usedPlayerIds.includes(secondPlayerId));

  function changeMode(nextMode: MatchMode) {
    setMode(nextMode);
    setSelectedPlayerIds([]);
    setPairs([]);
    setFirstPlayerId("");
    setSecondPlayerId("");
  }

  function addPair() {
    if (!canAddPair) return;
    setPairs((current) => [...current, [firstPlayerId, secondPlayerId]]);
    setFirstPlayerId("");
    setSecondPlayerId("");
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="matchMode" value={mode} />
      <input type="hidden" name="competitors" value={JSON.stringify(competitors)} />
      <input className="h-10 w-full rounded border bg-background px-3" name="name" placeholder="Tên giải đấu" required />

      <div className="grid grid-cols-2 gap-3">
        {([ ["ONE_V_ONE", "League 1v1", "Mỗi tuyển thủ là một đối thủ"], ["TWO_V_TWO", "League 2v2", "Mỗi cặp là một đối thủ"] ] as const).map(([value, title, description]) => (
          <button className={`rounded-xl border p-3 text-left ${mode === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => changeMode(value)} type="button">
            <span className="block font-black">{title}</span><span className="text-xs text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>

      {mode === "ONE_V_ONE" ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {players.map((player) => {
            const selected = selectedPlayerIds.includes(player.id);
            return <button className={`rounded border p-3 text-left font-semibold ${selected ? "border-primary bg-primary/10" : "border-border"}`} key={player.id} onClick={() => setSelectedPlayerIds((current) => selected ? current.filter((id) => id !== player.id) : [...current, player.id])} type="button">{player.name}</button>;
          })}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Tạo từng cặp bằng dropdown; một người không thể xuất hiện ở hai cặp.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select className="h-10 rounded border bg-background px-3" onChange={(event) => setFirstPlayerId(event.target.value)} value={firstPlayerId}><option value="">Người chơi thứ nhất</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === secondPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select>
            <select className="h-10 rounded border bg-background px-3" onChange={(event) => setSecondPlayerId(event.target.value)} value={secondPlayerId}><option value="">Người chơi thứ hai</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === firstPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select>
            <Button disabled={!canAddPair} onClick={addPair} type="button">Thêm cặp</Button>
          </div>
          {pairs.length ? <div className="space-y-2">{pairs.map(([firstId, secondId], index) => <div className="flex items-center justify-between rounded border px-3 py-2" key={`${firstId}-${secondId}`}><span className="font-semibold">{players.find((player) => player.id === firstId)?.name} + {players.find((player) => player.id === secondId)?.name}</span><button className="text-sm text-destructive" onClick={() => setPairs((current) => current.filter((_, pairIndex) => pairIndex !== index))} type="button">Bỏ</button></div>)}</div> : null}
        </div>
      )}
      <p className="text-sm text-muted-foreground">Cần tối thiểu 2 đối thủ. Đang có {competitors.length} đối thủ.</p>
      <Button className="w-full" disabled={competitors.length < 2} type="submit">Tạo League {mode === "ONE_V_ONE" ? "1v1" : "2v2"} & sinh lịch</Button>
    </form>
  );
}
