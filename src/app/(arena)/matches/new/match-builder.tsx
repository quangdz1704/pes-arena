"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Dices,
  Gamepad2,
  RefreshCw,
  Shuffle,
  Swords,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialActionState } from "@/lib/action-state";
import type {
  MatchPlayerDto,
  MatchSetupDto,
  MatchTeamDto,
} from "@/repositories/match.repository";
import {
  pickBalancedTeams,
  pickPureTeams,
  pickUnique,
  shufflePairs,
} from "@/services/match-randomization";

import { startMatchAction, type MatchActionState } from "../actions";

type MatchMode = "ONE_V_ONE" | "TWO_V_TWO";
type RandomMode = "PURE" | "BALANCED";
type MatchSetupMode = "RANDOM" | "MANUAL";

const initialMatchState: MatchActionState = initialActionState;

function PlayerName({ player }: { player: MatchPlayerDto | undefined }) {
  return player ? (
    <span className="font-bold">{player.name}</span>
  ) : (
    <span className="text-muted-foreground">Chưa chọn</span>
  );
}

function StartMatchButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className="h-14 w-full rounded-2xl text-base font-black"
    >
      <Gamepad2 className="size-5" />
      {pending ? "Đang bắt đầu..." : "BẮT ĐẦU TRẬN"}
    </Button>
  );
}

export function MatchBuilder({ setup }: { setup: MatchSetupDto }) {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>("ONE_V_ONE");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [sideAPlayerIds, setSideAPlayerIds] = useState<string[]>([]);
  const [sideBPlayerIds, setSideBPlayerIds] = useState<string[]>([]);
  const [poolId, setPoolId] = useState(setup.pools[0]?.id ?? "");
  const [matchSetupMode, setMatchSetupMode] = useState<MatchSetupMode>("RANDOM");
  const [randomMode, setRandomMode] = useState<RandomMode>("BALANCED");
  const [teamIds, setTeamIds] = useState<
    [string | undefined, string | undefined] | null
  >(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isRanked, setIsRanked] = useState(true);
  const [state, action] = useActionState(startMatchAction, initialMatchState);

  const playersPerSide = mode === "ONE_V_ONE" ? 1 : 2;
  const requiredPlayers = playersPerSide * 2;
  const selectedPool = useMemo(
    () => setup.pools.find((pool) => pool.id === poolId),
    [poolId, setup.pools],
  );
  const playerById = useMemo(
    () => new Map(setup.players.map((player) => [player.id, player])),
    [setup.players],
  );
  const teamById = useMemo(
    () => new Map(selectedPool?.teams.map((team) => [team.id, team]) ?? []),
    [selectedPool],
  );
  const selectedTeams = teamIds
    ? ([
        teamIds[0] ? teamById.get(teamIds[0]) : undefined,
        teamIds[1] ? teamById.get(teamIds[1]) : undefined,
      ] as [
        MatchTeamDto | undefined,
        MatchTeamDto | undefined,
      ])
    : null;
  const selectionReady =
    sideAPlayerIds.length === playersPerSide &&
    sideBPlayerIds.length === playersPerSide &&
    Boolean(selectedPool && selectedTeams?.[0] && selectedTeams[1]);

  useEffect(() => {
    if (state.status === "success" && state.matchId) {
      router.push(`/matches/${state.matchId}`);
    }
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [router, state]);

  function updateSides(playerIds: string[], nextMode = mode) {
    const perSide = nextMode === "ONE_V_ONE" ? 1 : 2;
    setSideAPlayerIds(playerIds.slice(0, perSide));
    setSideBPlayerIds(playerIds.slice(perSide, perSide * 2));
  }

  function selectMode(nextMode: MatchMode) {
    setMode(nextMode);
    setSelectedPlayerIds([]);
    updateSides([], nextMode);
  }

  function togglePlayer(playerId: string) {
    const currentlySelected = selectedPlayerIds.includes(playerId);
    const next = currentlySelected
      ? selectedPlayerIds.filter((id) => id !== playerId)
      : [...selectedPlayerIds, playerId];
    if (!currentlySelected && next.length > requiredPlayers) {
      toast.error(`Chế độ này chỉ cần ${requiredPlayers} người chơi.`);
      return;
    }
    setSelectedPlayerIds(next);
    updateSides(next);
  }

  function randomPlayers() {
    try {
      const playerIds = pickUnique(setup.players, requiredPlayers).map(
        (player) => player.id,
      );
      setSelectedPlayerIds(playerIds);
      updateSides(playerIds);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể random người chơi.",
      );
    }
  }

  function reshufflePairs() {
    try {
      const [nextA, nextB] = shufflePairs(selectedPlayerIds, [
        sideAPlayerIds,
        sideBPlayerIds,
      ]);
      setSideAPlayerIds(nextA);
      setSideBPlayerIds(nextB);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể đổi cặp.",
      );
    }
  }

  function changePool(nextPoolId: string) {
    setPoolId(nextPoolId);
    setTeamIds(null);
    setRerollCount(0);
  }

  function selectMatchSetupMode(nextMode: MatchSetupMode) {
    setMatchSetupMode(nextMode);
    setTeamIds(null);
    setRerollCount(0);
  }

  function selectManualTeam(sideIndex: 0 | 1, teamId: string) {
    const otherSideIndex = sideIndex === 0 ? 1 : 0;

    setTeamIds((current) => {
      const next: [string | undefined, string | undefined] = current
        ? [...current]
        : [undefined, undefined];

      if (next[sideIndex] === teamId) {
        next[sideIndex] = undefined;
      } else {
        next[sideIndex] = teamId;
        if (next[otherSideIndex] === teamId) next[otherSideIndex] = undefined;
      }

      return next;
    });
  }

  function randomTeams() {
    if (!selectedPool) return;
    try {
      const pick = randomMode === "PURE" ? pickPureTeams : pickBalancedTeams;
      const [first, second] = pick(selectedPool.teams);
      setIsRolling(true);
      const preview = pick(selectedPool.teams);
      setTeamIds([preview[0].id, preview[1].id]);
      window.setTimeout(() => {
        setTeamIds([first.id, second.id]);
        setRerollCount((count) => (teamIds ? count + 1 : 0));
        setIsRolling(false);
      }, 650);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể random đội bóng.",
      );
    }
  }

  const payload = JSON.stringify({
    composition: { matchMode: mode, sideAPlayerIds, sideBPlayerIds },
    teamPoolId: poolId,
    randomMode: matchSetupMode === "RANDOM" ? randomMode : null,
    sideATeamId: teamIds?.[0],
    sideBTeamId: teamIds?.[1],
    sideARerollCount: rerollCount,
    sideBRerollCount: rerollCount,
    isRanked,
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <Card className="border-primary/20 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="size-5 text-primary" /> 1. Chọn chế độ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {(
            [
              ["ONE_V_ONE", "1 VS 1", "Đấu tay đôi"],
              ["TWO_V_TWO", "2 VS 2", "Phối hợp đồng đội"],
            ] as const
          ).map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectMode(value)}
              className={`rounded-2xl border p-4 text-left transition ${mode === value ? "border-primary bg-primary/10 shadow-[0_0_24px_rgba(106,255,148,0.12)]" : "border-white/10 bg-background/40 hover:border-white/25"}`}
            >
              <span className="block text-lg font-black">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="size-5 text-primary" /> Cách tạo kèo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {(
            [
              ["RANDOM", "🎲 Random", "Quay đội bóng theo chế độ đã chọn"],
              ["MANUAL", "✍️ Thủ công", "Tự chọn đội cho từng bên"],
            ] as const
          ).map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectMatchSetupMode(value)}
              className={`rounded-2xl border p-4 text-left transition ${matchSetupMode === value ? "border-primary bg-primary/10 shadow-[0_0_24px_rgba(106,255,148,0.12)]" : "border-white/10 bg-background/40 hover:border-white/25"}`}
            >
              <span className="block text-lg font-black">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/80">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="size-5 text-primary" /> 2. Chọn người chơi
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={randomPlayers}
            disabled={setup.players.length < requiredPlayers}
          >
            <Dices className="size-4" /> Chọn ngẫu nhiên
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chọn {requiredPlayers} người khác nhau. Đang chọn{" "}
            {selectedPlayerIds.length}/{requiredPlayers}.
          </p>
          {setup.players.length < requiredPlayers ? (
            <p className="rounded-xl bg-amber-400/10 p-4 text-sm text-amber-200">
              Cần có ít nhất {requiredPlayers} người chơi đang hoạt động. Hãy
              thêm ở mục Người chơi.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {setup.players.map((player) => {
                const selected = selectedPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-left transition ${selected ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/25"}`}
                  >
                    <span className="font-bold">{player.name}</span>
                    {player.nickname ? (
                      <span className="text-xs text-muted-foreground">
                        {player.nickname}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-sm">
              <PlayerName player={playerById.get(sideAPlayerIds[0] ?? "")} />
              {sideAPlayerIds[1] ? (
                <>
                  {" "}
                  <span className="text-primary">+</span>{" "}
                  <PlayerName player={playerById.get(sideAPlayerIds[1])} />
                </>
              ) : null}
            </div>
            <span className="text-center text-xs font-black tracking-[0.2em] text-primary">
              VS
            </span>
            <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-3 text-center text-sm">
              <PlayerName player={playerById.get(sideBPlayerIds[0] ?? "")} />
              {sideBPlayerIds[1] ? (
                <>
                  {" "}
                  <span className="text-blue-300">+</span>{" "}
                  <PlayerName player={playerById.get(sideBPlayerIds[1])} />
                </>
              ) : null}
            </div>
          </div>
          {mode === "TWO_V_TWO" ? (
            <Button
              type="button"
              variant="outline"
              onClick={reshufflePairs}
              disabled={selectedPlayerIds.length !== 4}
              className="w-full"
            >
              <Shuffle className="size-4" /> Đổi cặp (giữ nguyên 4 người)
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dices className="size-5 text-primary" /> 3. {matchSetupMode === "RANDOM" ? "Random đội bóng" : "Chọn đội bóng"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {setup.pools.map((pool) => (
              <button
                key={pool.id}
                type="button"
                onClick={() => changePool(pool.id)}
                className={`rounded-xl border p-3 text-left transition ${poolId === pool.id ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/25"}`}
              >
                <span className="font-bold">
                  {pool.emoji ?? "🎲"} {pool.name}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {pool.teams.length} đội khả dụng
                </span>
              </button>
            ))}
          </div>
          {!selectedPool ? (
            <p className="rounded-xl bg-amber-400/10 p-4 text-sm text-amber-200">
              Chưa có nhóm đội đang hoạt động.
            </p>
          ) : null}
          {matchSetupMode === "RANDOM" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    [
                      "BALANCED",
                      "⚖️ Cân bằng",
                      "Ưu tiên cùng tier, rating gần nhau",
                    ],
                    ["PURE", "🎲 Ngẫu nhiên", "Có thể ra kèo chênh lệch"],
                  ] as const
                ).map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRandomMode(value);
                      setTeamIds(null);
                      setRerollCount(0);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${randomMode === value ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/25"}`}
                  >
                    <span className="block font-bold">{label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={randomTeams}
                disabled={!selectedPool || selectedPool.teams.length < 2 || isRolling}
                className="h-12 w-full rounded-xl font-black"
              >
                {isRolling ? <RefreshCw className="size-5 animate-spin" /> : <Dices className="size-5" />}
                {teamIds ? "QUAY LẠI" : "QUAY ĐỘI"}
              </Button>
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {([0, 1] as const).map((sideIndex) => {
                const otherTeamId = teamIds?.[sideIndex === 0 ? 1 : 0];
                const sideLabel = sideIndex === 0 ? "A" : "B";

                return (
                  <div key={sideIndex}>
                    <p className="mb-2 text-xs font-bold tracking-[0.18em] text-muted-foreground">
                      SIDE {sideLabel}
                    </p>
                    <Select
                      onValueChange={(teamId) => selectManualTeam(sideIndex, teamId)}
                      value={teamIds?.[sideIndex]}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Chọn đội cho Side ${sideLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPool?.teams.map((team) => (
                          <SelectItem
                            disabled={team.id === otherTeamId}
                            key={team.id}
                            value={team.id}
                          >
                            {team.name} · Tier {team.tier} · {team.rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
          <div
            className={`grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center ${isRolling ? "animate-pulse" : ""}`}
          >
            {[selectedTeams?.[0]].map((team, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-background/60 p-5 text-center"
              >
                <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground">
                  SIDE A
                </p>
                <p className="mt-2 text-lg font-black">{team?.name ?? "?"}</p>
                {team ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tier {team.tier} · {team.rating}
                  </p>
                ) : null}
              </div>
            ))}
            <span className="hidden text-center text-sm font-black text-primary sm:block">
              VS
            </span>
            {[selectedTeams?.[1]].map((team, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-background/60 p-5 text-center"
              >
                <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground">
                  SIDE B
                </p>
                <p className="mt-2 text-lg font-black">{team?.name ?? "?"}</p>
                {team ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tier {team.tier} · {team.rating}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {matchSetupMode === "RANDOM" && rerollCount > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              Đã quay lại {rerollCount} lần.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/80">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-bold">Trận xếp hạng</p>
            <p className="text-xs text-muted-foreground">
              Kết quả sẽ tính vào thống kê ở Phase 3.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRanked((value) => !value)}
            className={`rounded-full border px-4 py-2 text-xs font-black ${isRanked ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}
          >
            {isRanked ? "BẬT" : "TẮT"}
          </button>
        </CardContent>
      </Card>

      {state.status === "error" ? (
        <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <StartMatchButton disabled={!selectionReady || isRolling} />
    </form>
  );
}
