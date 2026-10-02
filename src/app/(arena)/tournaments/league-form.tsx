"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import { buildTournamentTeamPlan, getSameTierTeamGroups, pickSameTierTeams, randomizeFixtureTeams, type FixtureTeamAssignment } from "@/services/tournament-team-plan";

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
  const [assignTeams, setAssignTeams] = useState(false);
  const [teamAssignmentScope, setTeamAssignmentScope] = useState<"FIXED" | "PER_MATCH">("FIXED");
  const [fixtureTeams, setFixtureTeams] = useState<FixtureTeamAssignment[]>([]);
  const [isHomeAndAway, setIsHomeAndAway] = useState(true);
  const [state, action, pending] = useActionState(createTournamentAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") { toast.success(state.message); onSuccess(); router.refresh(); }
    if (state.status === "error") toast.error(state.message);
  }, [onSuccess, router, state]);

  const usedPlayerIds = mode === "ONE_V_ONE" ? selectedPlayerIds : pairs.flat();
  const competitors = mode === "ONE_V_ONE" ? selectedPlayerIds.map((id) => [id]) : pairs;
  const selectedPool = pools.find((pool) => pool.id === poolId);
  const labels = useMemo(() => competitors.map((group) => group.map((id) => players.find((player) => player.id === id)?.name ?? "?").join(" + ")), [competitors, players]);
  const assignedTeamIds = teamIds.slice(0, competitors.length);
  const fixturePlan = buildTournamentTeamPlan(type, competitors.length, isHomeAndAway);
  const teamsReady = !assignTeams || (teamAssignmentScope === "FIXED"
    ? assignedTeamIds.length === competitors.length && Array.from(assignedTeamIds).every(Boolean) && new Set(assignedTeamIds).size === competitors.length
    : fixturePlan.length > 0 && fixturePlan.every((fixture) => fixtureTeams.some((assignment) => assignment.round === fixture.round && assignment.position === fixture.position && assignment.homeTeamId && assignment.awayTeamId && assignment.homeTeamId !== assignment.awayTeamId)));
  const fixtureCount = fixturePlan.length;
  const randomTeamCount = teamAssignmentScope === "FIXED" ? competitors.length : 2;
  const canRandomizeTeams = fixtureCount > 0 && getSameTierTeamGroups(selectedPool?.teams ?? [], randomTeamCount).length > 0;

  const resetAssignments = () => { setTeamIds([]); setFixtureTeams([]); };
  const resetMode = (nextMode: MatchMode) => { setMode(nextMode); setSelectedPlayerIds([]); setPairs([]); resetAssignments(); };
  const addPair = () => {
    if (!firstPlayerId || !secondPlayerId || firstPlayerId === secondPlayerId || usedPlayerIds.includes(firstPlayerId) || usedPlayerIds.includes(secondPlayerId)) return;
    setPairs((current) => [...current, [firstPlayerId, secondPlayerId]]); setFirstPlayerId(""); setSecondPlayerId(""); resetAssignments();
  };
  const randomizeTeams = () => {
    if (!selectedPool || !canRandomizeTeams) return;
    if (teamAssignmentScope === "PER_MATCH") setFixtureTeams(randomizeFixtureTeams(fixturePlan, selectedPool.teams));
    else setTeamIds(pickSameTierTeams(selectedPool.teams, competitors.length).map((team) => team.id));
  };
  const setManualTeam = (index: number, teamId: string) => setTeamIds((current) => { const next = [...current]; next[index] = teamId; return next; });
  const setFixtureTeam = (round: number, position: number, side: "homeTeamId" | "awayTeamId", teamId: string) => setFixtureTeams((current) => {
    const assignment = current.find((fixture) => fixture.round === round && fixture.position === position) ?? { round, position, homeTeamId: "", awayTeamId: "" };
    return [...current.filter((fixture) => fixture.round !== round || fixture.position !== position), { ...assignment, [side]: teamId }];
  });

  return <form action={action} className="space-y-4">
    <input name="type" type="hidden" value={type} /><input name="matchMode" type="hidden" value={mode} />
    <input name="competitors" type="hidden" value={JSON.stringify(competitors)} /><input name="teamPoolId" type="hidden" value={assignTeams ? poolId : ""} />
    <input name="teamAssignmentScope" type="hidden" value={teamAssignmentScope} />
    <input name="fixtureTeams" type="hidden" value={JSON.stringify(assignTeams && teamAssignmentScope === "PER_MATCH" ? fixtureTeams : [])} />
    <input name="teamIds" type="hidden" value={JSON.stringify(assignTeams && teamAssignmentScope === "FIXED" ? assignedTeamIds : [])} /><input name="isHomeAndAway" type="hidden" value={String(type === "LEAGUE" && isHomeAndAway)} />
    <input className="h-10 w-full rounded border bg-background px-3" name="name" placeholder="Tên giải đấu" required />

    <div className="grid grid-cols-2 gap-3">{([ ["LEAGUE", "League", "Tự sinh lịch vòng tròn"], ["KNOCKOUT", "Knockout", "Thua là dừng cuộc chơi"] ] as const).map(([value, title, detail]) => <button className={`rounded-xl border p-3 text-left ${type === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => { setType(value); resetAssignments(); }} type="button"><span className="block font-black">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></button>)}</div>
    {type === "LEAGUE" ? <button className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${isHomeAndAway ? "border-primary bg-primary/10" : "border-border"}`} onClick={() => { setIsHomeAndAway((value) => !value); resetAssignments(); }} type="button"><span><span className="block font-black">🏟️ Lượt đi & lượt về</span><span className="text-xs text-muted-foreground">Mỗi cặp gặp nhau hai lần, đổi sân như Ngoại hạng Anh.</span></span><b className="text-primary">{isHomeAndAway ? "BẬT" : "TẮT"}</b></button> : null}
    <div className="grid grid-cols-2 gap-3">{([ ["ONE_V_ONE", "1v1", "Mỗi tuyển thủ là một đối thủ"], ["TWO_V_TWO", "2v2", "Mỗi cặp là một đối thủ"] ] as const).map(([value, title, detail]) => <button className={`rounded-xl border p-3 text-left ${mode === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => resetMode(value)} type="button"><span className="block font-black">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></button>)}</div>
    {mode === "ONE_V_ONE" ? <div className="grid gap-2 sm:grid-cols-3">{players.map((player) => { const selected = selectedPlayerIds.includes(player.id); return <button className={`rounded border p-3 text-left font-semibold ${selected ? "border-primary bg-primary/10" : "border-border"}`} key={player.id} onClick={() => { setSelectedPlayerIds((current) => selected ? current.filter((id) => id !== player.id) : [...current, player.id]); resetAssignments(); }} type="button">{player.name}</button>; })}</div> : <div className="space-y-3 rounded-xl border p-4"><p className="text-sm text-muted-foreground">Tạo từng cặp; một người không thể xuất hiện ở hai cặp.</p><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select className="h-10 rounded border bg-background px-3" onChange={(event) => setFirstPlayerId(event.target.value)} value={firstPlayerId}><option value="">Người chơi thứ nhất</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === secondPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select><select className="h-10 rounded border bg-background px-3" onChange={(event) => setSecondPlayerId(event.target.value)} value={secondPlayerId}><option value="">Người chơi thứ hai</option>{players.map((player) => <option disabled={usedPlayerIds.includes(player.id) || player.id === firstPlayerId} key={player.id} value={player.id}>{player.name}</option>)}</select><Button onClick={addPair} type="button">Thêm cặp</Button></div>{pairs.map((pair, index) => <div className="flex justify-between rounded border px-3 py-2" key={pair.join("-")}><b>{pair.map((id) => players.find((player) => player.id === id)?.name).join(" + ")}</b><button className="text-destructive" onClick={() => { setPairs((current) => current.filter((_, pairIndex) => pairIndex !== index)); resetAssignments(); }} type="button">Bỏ</button></div>)}</div>}

    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
      <input checked={assignTeams} className="mt-1 size-4 accent-primary" onChange={(event) => { setAssignTeams(event.target.checked); resetAssignments(); }} type="checkbox" />
      <span><span className="block font-bold">Gán đội khi tạo giải (không bắt buộc)</span><span className="mt-1 block text-xs text-muted-foreground">Nếu không bật, bạn chọn hoặc random đội khi bắt đầu từng trận.</span></span>
    </label>
    {assignTeams ? (
      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black">Cách gán đội</p>
          <span className="text-xs font-bold text-primary">{teamsReady ? "Đã gán đủ" : "Chưa gán đủ"}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {([["FIXED", "Cố định cả giải", "Mỗi người/cặp dùng một đội trong mọi trận."], ["PER_MATCH", "Theo từng trận", "Mỗi trận có hai đội riêng, lưu sẵn theo lịch."]] as const).map(([value, title, detail]) => (
            <button className={`rounded-xl border p-3 text-left ${teamAssignmentScope === value ? "border-primary bg-primary/10" : "border-border"}`} key={value} onClick={() => { setTeamAssignmentScope(value); resetAssignments(); }} type="button">
              <span className="block text-sm font-bold">{title}</span><span className="text-xs text-muted-foreground">{detail}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {pools.map((pool) => <button className={`rounded-lg border p-2 text-left text-sm ${pool.id === poolId ? "border-primary bg-primary/10" : "border-border"}`} key={pool.id} onClick={() => { setPoolId(pool.id); resetAssignments(); }} type="button">{pool.emoji ?? "⚽"} {pool.name} <span className="text-muted-foreground">· {pool.teams.length} đội</span></button>)}
        </div>
        <div className="flex gap-2">
          {(["RANDOM", "MANUAL"] as const).map((value) => <button className={`rounded-full border px-3 py-1.5 text-xs font-bold ${teamSelectionMode === value ? "border-primary bg-primary/10 text-primary" : "border-border"}`} key={value} onClick={() => { setTeamSelectionMode(value); resetAssignments(); }} type="button">{value === "RANDOM" ? "🎲 Random đội" : "✍️ Thủ công"}</button>)}
        </div>
        {teamSelectionMode === "RANDOM" ? (
          <div className="space-y-2">
            <Button className="w-full" disabled={!canRandomizeTeams} onClick={randomizeTeams} type="button">
              <Dices /> {fixtureCount === 0 ? "Chọn đủ người chơi trước" : teamAssignmentScope === "FIXED" ? `Random ${competitors.length} đội cùng tier` : `Random cùng tier cho ${fixtureCount} trận`}
            </Button>
            <p className="text-xs text-muted-foreground">{fixtureCount > 0 && !canRandomizeTeams ? `Nhóm đội không có tier nào đủ ${randomTeamCount} đội khác nhau. Chọn nhóm khác hoặc gán thủ công.` : teamAssignmentScope === "FIXED" ? "Tất cả đội được random cùng tier và không trùng nhau." : "Hai đội trong mỗi trận luôn cùng tier, không trùng nhau."}</p>
          </div>
        ) : null}
        {teamAssignmentScope === "FIXED" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {labels.map((label, index) => (
              <label className="grid min-w-0 gap-1 text-sm" key={index}>
                <b>{label}</b>
                <select aria-label={`Đội cố định của ${label}`} className="h-10 w-full min-w-0 rounded border bg-background px-3" disabled={teamSelectionMode === "RANDOM"} onChange={(event) => setManualTeam(index, event.target.value)} value={assignedTeamIds[index] ?? ""}>
                  <option value="">Chưa chọn đội</option>
                  {selectedPool?.teams.map((team) => <option disabled={assignedTeamIds.includes(team.id) && assignedTeamIds[index] !== team.id} key={team.id} value={team.id}>{team.name} · Tier {team.tier}</option>)}
                </select>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Hai bên không trùng đội trong cùng một trận; đội có thể được dùng lại ở trận khác. Random ưu tiên tránh đội vừa xuất hiện.</p>
            {type === "KNOCKOUT" ? <p className="text-xs text-muted-foreground">Vòng đầu dùng hạt giống theo Điểm Arena. Các vòng sau gán đội cho vị trí nhánh đấu, ai đi tiếp sẽ nhận đội đó.</p> : null}
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {fixturePlan.map((fixture) => {
                const assignment = fixtureTeams.find((item) => item.round === fixture.round && item.position === fixture.position);
                const homeLabel = type === "LEAGUE" ? labels[fixture.home!] : fixture.home === null ? `Thắng trận ${fixture.position * 2 - 1} vòng ${fixture.round - 1}` : `Hạt giống #${fixture.home + 1}`;
                const awayLabel = type === "LEAGUE" ? labels[fixture.away!] : fixture.away === null ? `Thắng trận ${fixture.position * 2} vòng ${fixture.round - 1}` : `Hạt giống #${fixture.away + 1}`;
                return (
                  <div className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-3" key={`${fixture.round}:${fixture.position}`}>
                    <p className="text-xs font-bold text-primary">Vòng {fixture.round} · Trận {fixture.position}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([["homeTeamId", homeLabel, "awayTeamId"], ["awayTeamId", awayLabel, "homeTeamId"]] as const).map(([side, label, opposite]) => (
                        <label className="grid min-w-0 gap-1 text-xs" key={side}>
                          <span className="font-semibold">{label}</span>
                          <select aria-label={`Đội của ${label}, vòng ${fixture.round}, trận ${fixture.position}`} className="h-10 w-full min-w-0 rounded border bg-background px-2 text-sm" disabled={teamSelectionMode === "RANDOM"} onChange={(event) => setFixtureTeam(fixture.round, fixture.position, side, event.target.value)} value={assignment?.[side] ?? ""}>
                            <option value="">Chưa chọn đội</option>
                            {selectedPool?.teams.map((team) => <option disabled={assignment?.[opposite] === team.id} key={team.id} value={team.id}>{team.name} · Tier {team.tier}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : null}
    <p className="text-sm text-muted-foreground">{type === "KNOCKOUT" ? `Knockout cần 2, 4 hoặc 8 đối thủ. Đang có ${competitors.length}.` : `League sẽ sinh ${fixtureCount} trận ${isHomeAndAway ? "lượt đi–về" : "lượt đi"}.`}</p>
    <Button className="w-full" disabled={pending || competitors.length > 8 || competitors.length < 2 || !teamsReady || (assignTeams && !poolId) || (type === "KNOCKOUT" && ![2, 4, 8].includes(competitors.length))} type="submit">{pending ? "Đang tạo…" : "Tạo"} {type === "KNOCKOUT" ? "bracket knockout" : "League"} {mode === "ONE_V_ONE" ? "1v1" : "2v2"}</Button>
  </form>;
}
