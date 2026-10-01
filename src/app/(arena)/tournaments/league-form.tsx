"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import { pickUnique } from "@/services/match-randomization";

import { createTournamentAction } from "./actions";

type PlayerOption = { id: string; name: string };
type TeamOption = { id: string; name: string; tier: "S" | "A" | "B" | "C"; rating: number };
type PoolOption = { id: string; name: string; emoji: string | null; teams: TeamOption[] };
type MatchMode = "ONE_V_ONE" | "TWO_V_TWO";
type TournamentType = "LEAGUE" | "KNOCKOUT";
type TeamSelectionMode = "RANDOM" | "MANUAL";

export function TournamentForm({ onSuccess, players, pools }: { onSuccess: () => void; players: PlayerOption[]; pools: PoolOption[] }) {
  const router = useRouter();
  const [type, setType] = useState<TournamentType>("LEAGUE");
  const [mode, setMode] = useState<MatchMode>("ONE_V_ONE");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [pairs, setPairs] = useState<string[][]>([]);
  const [firstPlayerId, setFirstPlayerId] = useState("");
  const [secondPlayerId, setSecondPlayerId] = useState("");
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [teamSelectionMode, setTeamSelectionMode] = useState<TeamSelectionMode>("RANDOM");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [isHomeAndAway, setIsHomeAndAway] = useState(true);
  const [state, action] = useActionState(createTournamentAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") { toast.success(state.message); onSuccess(); router.refresh(); }
    if (state.status === "error") toast.error(state.message);
  }, [onSuccess, router, state]);

  const usedPlayerIds = mode === "ONE_V_ONE" ? selectedPlayerIds : pairs.flat();
  const competitors = mode === "ONE_V_ONE" ? selectedPlayerIds.map((id) => [id]) : pairs;
  const selectedPool = pools.find((pool) => pool.id === poolId);
  const labels = useMemo(() => competitors.map((group) => group.map((id) => players.find((player) => player.id === id)?.name ?? "?").join(" + ")), [competitors, players]);
  const assignedTeamIds = teamIds.slice(0, competitors.length);
  const teamsReady = assignedTeamIds.length === competitors.length && new Set(assignedTeamIds).size === competitors.length;
  const fixtureCount = competitors.length < 2 ? 0 : competitors.length * (competitors.length - 1) / 2 * (type === "LEAGUE" && isHomeAndAway ? 2 : 1);

  const resetAssignments = () => setTeamIds([]);
  const resetMode = (nextMode: MatchMode) => { setMode(nextMode); setSelectedPlayerIds([]); setPairs([]); resetAssignments(); };
  const addPair = () => {
    if (!firstPlayerId || !secondPlayerId || firstPlayerId === secondPlayerId || usedPlayerIds.includes(firstPlayerId) || usedPlayerIds.includes(secondPlayerId)) return;
    setPairs((current) => [...current, [firstPlayerId, secondPlayerId]]); setFirstPlayerId(""); setSecondPlayerId(""); resetAssignments();
  };
  const randomizeTeams = () => { if (selectedPool && selectedPool.teams.length >= competitors.length) setTeamIds(pickUnique(selectedPool.teams, competitors.length).map((team) => team.id)); };
  const setManualTeam = (index: number, teamId: string) => setTeamIds((current) => { const next = [...current]; next[index] = teamId; return next; });

  return <form action={action} className="space-y-4">
    <input name="type" type="hidden" value={type} /><input name="matchMode" type="hidden" value={mode} />
    <input name="competitors" type="hidden" value={JSON.stringify(competitors)} /><input name="teamPoolId" type="hidden" value={poolId} />
    <input name="teamIds" type="hidden" value={JSON.stringify(assignedTeamIds)} /><input name="isHomeAndAway" type="hidden" value={String(type === "LEAGUE" && isHomeAndAway)} />
    <input className="h-10 w-full rounded border bg-background px-3" name="name" placeholder="Tên giải đấu" required />

    <div className="grid grid-cols-2 gap-3">{([ ["LEAGUE", "League", "Tự sinh lịch vòng tròn"], ["KNOCKOUT", "Knockout", "Thua là dừng cuộc chơi"] ] as const).map(([value, title, detail]) => <button className={`rounded-xl border p-3 text-left ${type === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => setType(value)} type="button"><span className="block font-black">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></button>)}</div>
    {type === "LEAGUE" ? <button className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${isHomeAndAway ? "border-primary bg-primary/10" : "border-border"}`} onClick={() => setIsHomeAndAway((value) => !value)} type="button"><span><span className="block font-black">🏟️ Lượt đi & lượt về</span><span className="text-xs text-muted-foreground">Mỗi cặp gặp nhau hai lần, đổi sân như Ngoại hạng Anh.</span></span><b className="text-primary">{isHomeAndAway ? "BẬT" : "TẮT"}</b></button> : null}
    <div className="grid grid-cols-2 gap-3">{([ ["ONE_V_ONE", "1v1", "Mỗi tuyển thủ là một đối thủ"], ["TWO_V_TWO", "2v2", "Mỗi cặp là một đối thủ"] ] as const).map(([value, title, detail]) => <button className={`rounded-xl border p-3 text-left ${mode === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => resetMode(value)} type="button"><span className="block font-black">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></button>)}</div>
    {mode === "ONE_V_ONE" ? <div className="grid gap-2 sm:grid-cols-3">{players.map((player) => { const selected = selectedPlayerIds.includes(player.id); return <button className={`rounded border p-3 text-left font-semibold ${selected ? "border-primary bg-primary/10" : "border-border"}`} key={player.id} onClick={() => { setSelectedPlayerIds((current) => selected ? current.filter((id) => id !== player.id) : [...current, player.id]); resetAssignments(); }} type="button">{player.name}</button>; })}</div> : <div className="space-y-3 rounded-xl border p-4"><p className="text-sm text-muted-foreground">Tạo từng cặp; một người không thể xuất hiện ở hai cặp.</p><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select className="h-10 rounded border bg-background px-3" onChange={(event) => setFirstPlayerId(event.target.value)} value={firstPlayerId}><option value="">Người chơi thứ nhất</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === secondPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select><select className="h-10 rounded border bg-background px-3" onChange={(event) => setSecondPlayerId(event.target.value)} value={secondPlayerId}><option value="">Người chơi thứ hai</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === firstPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select><Button onClick={addPair} type="button">Thêm cặp</Button></div>{pairs.map((pair, index) => <div className="flex justify-between rounded border px-3 py-2" key={pair.join("-")}><b>{pair.map((id) => players.find((player) => player.id === id)?.name).join(" + ")}</b><button className="text-destructive" onClick={() => { setPairs((current) => current.filter((_, pairIndex) => pairIndex !== index)); resetAssignments(); }} type="button">Bỏ</button></div>)}</div>}

    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black">Chọn đội cho giải</p><p className="text-xs text-muted-foreground">Đội được giữ cố định cho tuyển thủ/cặp xuyên suốt giải.</p></div><span className="text-xs font-bold text-primary">{teamsReady ? "Đã gán đủ" : "Chưa gán đủ"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{pools.map((pool) => <button className={`rounded-lg border p-2 text-left text-sm ${pool.id === poolId ? "border-primary bg-primary/10" : "border-border"}`} key={pool.id} onClick={() => { setPoolId(pool.id); resetAssignments(); }} type="button">{pool.emoji ?? "⚽"} {pool.name} <span className="text-muted-foreground">· {pool.teams.length} đội</span></button>)}</div><div className="mt-3 flex gap-2">{(["RANDOM", "MANUAL"] as const).map((value) => <button className={`rounded-full border px-3 py-1.5 text-xs font-bold ${teamSelectionMode === value ? "border-primary bg-primary/10 text-primary" : "border-border"}`} key={value} onClick={() => { setTeamSelectionMode(value); resetAssignments(); }} type="button">{value === "RANDOM" ? "🎲 Random đội" : "✍️ Thủ công"}</button>)}</div>{teamSelectionMode === "RANDOM" ? <Button className="mt-3 w-full" disabled={!selectedPool || selectedPool.teams.length < competitors.length || competitors.length < 2} onClick={randomizeTeams} type="button"><Dices /> Random {competitors.length} đội không trùng</Button> : <div className="mt-3 space-y-2">{labels.map((label, index) => <label className="grid gap-1 text-sm" key={`${label}-${index}`}><b>{label}</b><select className="h-10 rounded border bg-background px-3" onChange={(event) => setManualTeam(index, event.target.value)} value={assignedTeamIds[index] ?? ""}><option value="">Chọn đội</option>{selectedPool?.teams.map((team) => <option disabled={assignedTeamIds.includes(team.id) && assignedTeamIds[index] !== team.id} key={team.id} value={team.id}>{team.name} · Tier {team.tier} · {team.rating}</option>)}</select></label>)}</div>}{assignedTeamIds.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{labels.map((label, index) => <p className="rounded-lg bg-background/60 px-3 py-2 text-sm" key={`${label}-${index}`}>{label} → <b className="text-primary">{selectedPool?.teams.find((team) => team.id === assignedTeamIds[index])?.name ?? "Chưa chọn"}</b></p>)}</div> : null}</div>
    <p className="text-sm text-muted-foreground">{type === "KNOCKOUT" ? `Knockout cần 2, 4 hoặc 8 đối thủ. Đang có ${competitors.length}.` : `League sẽ sinh ${fixtureCount} trận ${isHomeAndAway ? "lượt đi–về" : "lượt đi"}.`}</p>
    <Button className="w-full" disabled={competitors.length < 2 || !teamsReady || !poolId || (type === "KNOCKOUT" && ![2, 4, 8].includes(competitors.length))} type="submit">Tạo {type === "KNOCKOUT" ? "bracket knockout" : "League"} {mode === "ONE_V_ONE" ? "1v1" : "2v2"}</Button>
  </form>;
}
