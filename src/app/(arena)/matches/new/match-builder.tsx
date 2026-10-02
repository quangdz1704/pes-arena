"use client";

import { Fragment, useActionState, useEffect, useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Dices,
  Gamepad2,
  RefreshCw,
  Search,
  Shuffle,
  Swords,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { ArenaRankMark } from "@/components/shared/arena-rank-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import type {
  MatchPlayerDto,
  MatchSetupDto,
  MatchTeamDto,
} from "@/repositories/match.repository";
import {
  pickFreshBalancedTeams,
  pickFreshPureTeams,
  pickUnique,
  shufflePairs,
} from "@/services/match-randomization";
import { getTeamCompetition, listTeamCompetitions } from "@/services/team-competition";

import { startMatchAction, type MatchActionState } from "../actions";

type MatchMode = "ONE_V_ONE" | "TWO_V_TWO";
type RandomMode = "PURE" | "BALANCED";
type MatchSetupMode = "RANDOM" | "MANUAL";
type RandomTierFilter = "ALL" | "S" | "A" | "B";

const initialMatchState: MatchActionState = initialActionState;

function PlayerPortrait({ player }: { player: MatchPlayerDto }) {
  return (
    <Avatar size="sm">
      <AvatarImage alt={player.name} src={player.avatarUrl ?? undefined} />
      <AvatarFallback>{player.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("")}</AvatarFallback>
    </Avatar>
  );
}

const selectClassName = "h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SetupTabs<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div aria-label={label} role="group" className="inline-flex rounded-lg bg-background/70 p-1">
      {options.map(([option, text]) => (
        <button
          aria-pressed={value === option}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${value === option ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          disabled={disabled}
          key={option}
          onClick={() => { if (option !== value) onChange(option); }}
          type="button"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function StartMatchButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className="h-11 w-full rounded-xl text-sm font-bold"
    >
      <Gamepad2 className="size-5" />
      {pending ? "Đang bắt đầu..." : "Bắt đầu trận"}
    </Button>
  );
}

function TeamSearchSelect({
  label,
  teams,
  selectedTeamId,
  unavailableTeamId,
  onSelect,
}: {
  label: string;
  teams: MatchTeamDto[];
  selectedTeamId: string | undefined;
  unavailableTeamId: string | undefined;
  onSelect: (teamId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleTeams = teams.filter((team) =>
    `${team.name} ${team.shortName} ${team.tier}`.toLocaleLowerCase("vi").includes(normalizedQuery),
  ).slice(0, 40);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={`Tìm đội cho bên ${label}`}
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:ring-3"
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onFocus={() => { setQuery(""); setOpen(true); }}
          placeholder={selectedTeam ? selectedTeam.name : `Tìm đội cho bên ${label}`}
          role="combobox"
          value={query}
        />
      </div>
      {selectedTeam && !open ? <p className="mt-1 truncate text-xs text-muted-foreground">Đã chọn: {selectedTeam.name} · Tier {selectedTeam.tier} · {selectedTeam.rating}</p> : null}
      {open ? (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-xl" id={listboxId} role="listbox">
          {visibleTeams.length ? visibleTeams.map((team) => {
            const unavailable = team.id === unavailableTeamId;
            return (
              <button
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                disabled={unavailable}
                key={team.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onSelect(team.id); setQuery(""); setOpen(false); }}
                aria-selected={team.id === selectedTeamId}
                role="option"
                type="button"
              >
                <span className="font-semibold">{team.name}</span>
                <span className="text-xs text-muted-foreground">{team.shortName} · Tier {team.tier} · {team.rating}</span>
              </button>
            );
          }) : <p className="px-3 py-4 text-sm text-muted-foreground">Không tìm thấy đội phù hợp.</p>}
        </div>
      ) : null}
    </div>
  );
}

type TournamentFixtureStart = {
  id: string;
  tournamentId: string;
  matchId: string | null;
  homePlayerIds: string[];
  awayPlayerIds: string[];
  homeName: string;
  awayName: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO" | undefined;
  teamPoolId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export function MatchBuilder({
  setup,
  tournamentFixture,
}: {
  setup: MatchSetupDto;
  tournamentFixture: TournamentFixtureStart | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>(tournamentFixture?.matchMode ?? "ONE_V_ONE");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => tournamentFixture ? [...tournamentFixture.homePlayerIds, ...tournamentFixture.awayPlayerIds] : []);
  const [sideAPlayerIds, setSideAPlayerIds] = useState<string[]>(() => tournamentFixture?.homePlayerIds ?? []);
  const [sideBPlayerIds, setSideBPlayerIds] = useState<string[]>(() => tournamentFixture?.awayPlayerIds ?? []);
  const [poolId, setPoolId] = useState(tournamentFixture?.teamPoolId ?? setup.pools[0]?.id ?? "");
  const [matchSetupMode, setMatchSetupMode] = useState<MatchSetupMode>("RANDOM");
  const [randomMode, setRandomMode] = useState<RandomMode>("BALANCED");
  const [randomTierFilter, setRandomTierFilter] = useState<RandomTierFilter>("ALL");
  const [competitionFilter, setCompetitionFilter] = useState("ALL");
  const [teamIds, setTeamIds] = useState<
    [string | undefined, string | undefined] | null
  >(() => tournamentFixture?.homeTeamId && tournamentFixture.awayTeamId ? [tournamentFixture.homeTeamId, tournamentFixture.awayTeamId] : null);
  const [rerollCount, setRerollCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isRanked, setIsRanked] = useState(true);
  const [state, action, isPending] = useActionState(startMatchAction, initialMatchState);

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
  const availableCompetitions = useMemo(
    () => listTeamCompetitions(selectedPool?.teams ?? []),
    [selectedPool],
  );
  const randomCandidateTeams = useMemo(
    () => (selectedPool?.teams ?? []).filter((team) =>
      (randomTierFilter === "ALL" || team.tier === randomTierFilter) &&
      (competitionFilter === "ALL" || getTeamCompetition(team) === competitionFilter),
    ),
    [competitionFilter, randomTierFilter, selectedPool],
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
  const hasAssignedTournamentTeams = Boolean(tournamentFixture?.teamPoolId && tournamentFixture.homeTeamId && tournamentFixture.awayTeamId);

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
    setCompetitionFilter("ALL");
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
      const recentTeamIds = [
        ...(teamIds?.filter((id): id is string => Boolean(id)) ?? []),
        ...setup.recentTeamIds,
      ];
      const pick = randomMode === "PURE" ? pickFreshPureTeams : pickFreshBalancedTeams;
      const [first, second] = pick(randomCandidateTeams, recentTeamIds);
      setIsRolling(true);
      const preview = pick(randomCandidateTeams, recentTeamIds);
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
    randomMode: !hasAssignedTournamentTeams && matchSetupMode === "RANDOM" ? randomMode : null,
    sideATeamId: teamIds?.[0],
    sideBTeamId: teamIds?.[1],
    sideARerollCount: rerollCount,
    sideBRerollCount: rerollCount,
    isRanked,
    tournamentFixtureId: tournamentFixture?.id,
  });

  return (
    <form action={action} className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="payload" value={payload} />

      <fieldset disabled={isRolling || isPending} className="min-w-0 divide-y rounded-2xl border bg-card/80">
        <legend className="sr-only">Thiết lập trận đấu</legend>
        <section className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Swords aria-hidden className="size-4 text-primary" /> Thể thức
          </h2>
          <SetupTabs
            label="Thể thức trận đấu"
            value={mode}
            options={[["ONE_V_ONE", "1 vs 1"], ["TWO_V_TWO", "2 vs 2"]]}
            disabled={Boolean(tournamentFixture)}
            onChange={selectMode}
          />
        </section>

        <section className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <UsersRound aria-hidden className="size-4 text-primary" /> Người chơi
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {selectedPlayerIds.length}/{requiredPlayers}
              </span>
            </h2>
            {!tournamentFixture ? (
              <div className="flex items-center gap-1">
                {mode === "TWO_V_TWO" ? (
                  <Button type="button" variant="ghost" size="sm" onClick={reshufflePairs} disabled={selectedPlayerIds.length !== 4}>
                    <Shuffle className="size-3.5" /> Đổi cặp
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={randomPlayers} disabled={setup.players.length < requiredPlayers}>
                  <Dices className="size-3.5" /> Random
                </Button>
              </div>
            ) : null}
          </div>
          {tournamentFixture ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Người chơi đã được chốt theo lịch thi đấu của giải.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {mode === "ONE_V_ONE" ? "Chọn lần lượt bên A, rồi bên B." : "Hai người đầu là bên A, hai người tiếp theo là bên B."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {setup.players.map((player) => {
              const side = sideAPlayerIds.includes(player.id) ? "A" : sideBPlayerIds.includes(player.id) ? "B" : null;
              return (
                <button
                  aria-pressed={Boolean(side)}
                  className={`inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring ${side === "A" ? "border-primary/40 bg-primary/10" : side === "B" ? "border-sky-400/40 bg-sky-400/10" : "border-transparent bg-background/60 hover:border-border"}`}
                  disabled={Boolean(tournamentFixture)}
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  title={player.nickname ?? undefined}
                  type="button"
                >
                  <PlayerPortrait player={player} />
                  <span className="min-w-0 break-words font-semibold">{player.name}</span>
                  {side ? <span className={`text-[10px] font-bold ${side === "A" ? "text-primary" : "text-sky-400"}`}>{side}</span> : null}
                </button>
              );
            })}
          </div>
          {setup.players.length < requiredPlayers ? (
            <p className="text-xs text-amber-400">Cần ít nhất {requiredPlayers} người chơi đang hoạt động. Hãy thêm ở mục Người chơi.</p>
          ) : null}
        </section>

        <section className="relative space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Dices aria-hidden className="size-4 text-primary" /> Đội bóng
            </h2>
            {!hasAssignedTournamentTeams ? (
              <SetupTabs
                label="Cách chọn đội bóng"
                value={matchSetupMode}
                options={[["RANDOM", "Random"], ["MANUAL", "Chọn tay"]]}
                onChange={selectMatchSetupMode}
              />
            ) : <span className="text-xs text-primary">Đã gán theo lịch</span>}
          </div>
          {!hasAssignedTournamentTeams ? (
            <label className="block space-y-1.5 text-xs text-muted-foreground">
              <span>Nhóm đội</span>
              <select className={selectClassName} value={poolId} onChange={(event) => changePool(event.target.value)}>
                {!setup.pools.length ? <option value="">Chưa có nhóm đội</option> : null}
                {setup.pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>{pool.emoji ?? "🎲"} {pool.name} · {pool.teams.length} đội</option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">Đội bóng được giữ theo lựa chọn đã gán cho trận này.</p>
          )}
          {!selectedPool ? <p className="text-xs text-amber-400">Chưa có nhóm đội đang hoạt động.</p> : null}

          {!hasAssignedTournamentTeams && matchSetupMode === "RANDOM" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="min-w-0 space-y-1.5 text-xs text-muted-foreground">
                  <span>Cách random</span>
                  <select
                    className={selectClassName}
                    value={randomMode}
                    onChange={(event) => { setRandomMode(event.target.value as RandomMode); setTeamIds(null); setRerollCount(0); }}
                  >
                    <option value="BALANCED">Cân bằng</option>
                    <option value="PURE">Hoàn toàn ngẫu nhiên</option>
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5 text-xs text-muted-foreground">
                  <span>Tier đội bóng</span>
                  <select
                    className={selectClassName}
                    value={randomTierFilter}
                    onChange={(event) => { setRandomTierFilter(event.target.value as RandomTierFilter); setTeamIds(null); setRerollCount(0); }}
                  >
                    <option value="ALL">Mọi tier</option>
                    <option value="S">Siêu sao · Tier S</option>
                    <option value="A">Tier A</option>
                    <option value="B">Tier B</option>
                  </select>
                </label>
                <label className="col-span-2 space-y-1.5 text-xs text-muted-foreground">
                  <span>Giải đấu</span>
                  <select
                    className={selectClassName}
                    value={competitionFilter}
                    onChange={(event) => { setCompetitionFilter(event.target.value); setTeamIds(null); setRerollCount(0); }}
                  >
                    <option value="ALL">Tất cả giải đấu</option>
                    {availableCompetitions.map((competition) => <option key={competition} value={competition}>{competition}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {randomCandidateTeams.length} đội phù hợp · {randomMode === "BALANCED" ? "Ưu tiên cùng tier hoặc điểm sức mạnh gần nhau." : "Có thể ra kèo chênh lệch."} Hạn chế lặp đội vừa đá khi còn lựa chọn khác.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={randomTeams}
                disabled={!selectedPool || randomCandidateTeams.length < 2 || isRolling}
                className="h-10 w-full rounded-lg"
              >
                {isRolling ? <RefreshCw className="size-4 animate-spin" /> : <Dices className="size-4" />}
                {isRolling ? "Đang quay..." : teamIds ? "Quay lại đội bóng" : "Quay đội bóng"}
              </Button>
              {selectedPool && randomCandidateTeams.length < 2 ? (
                <p className="text-xs text-amber-400">Cần ít nhất 2 đội phù hợp. Hãy đổi bộ lọc hoặc nhóm đội.</p>
              ) : null}
            </>
          ) : !hasAssignedTournamentTeams ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {([0, 1] as const).map((sideIndex) => (
                <div key={sideIndex} className="min-w-0">
                  <p className={`mb-2 text-xs font-semibold ${sideIndex === 0 ? "text-primary" : "text-sky-400"}`}>
                    Bên {sideIndex === 0 ? "A" : "B"} · {(sideIndex === 0 ? sideAPlayerIds : sideBPlayerIds).map((id) => playerById.get(id)?.name).join(" + ") || "Chưa chọn người chơi"}
                  </p>
                  <TeamSearchSelect
                    label={sideIndex === 0 ? "A" : "B"}
                    onSelect={(teamId) => selectManualTeam(sideIndex, teamId)}
                    selectedTeamId={teamIds?.[sideIndex]}
                    teams={selectedPool?.teams ?? []}
                    unavailableTeamId={teamIds?.[sideIndex === 0 ? 1 : 0]}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </fieldset>

      <aside className="min-w-0 rounded-2xl border bg-card xl:sticky xl:top-20" aria-label="Xem trước trận đấu">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-bold">Kèo đấu của bạn</h2>
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            {tournamentFixture ? "Đấu giải" : isRanked ? "Giao hữu xếp hạng" : "Giao hữu"} · {mode === "ONE_V_ONE" ? "1v1" : "2v2"}
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-4 py-5">
          {([0, 1] as const).map((sideIndex) => {
            const playerIds = sideIndex === 0 ? sideAPlayerIds : sideBPlayerIds;
            const team = selectedTeams?.[sideIndex];
            return (
              <Fragment key={sideIndex}>
                <div className="min-w-0 space-y-3 text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${sideIndex === 0 ? "text-primary" : "text-sky-400"}`}>
                    Bên {sideIndex === 0 ? "A" : "B"}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: playersPerSide }, (_, index) => {
                      const player = playerById.get(playerIds[index] ?? "");
                      return (
                        <div key={index} className="flex min-h-8 flex-col items-center gap-1.5">
                          {player ? <PlayerPortrait player={player} /> : <UsersRound aria-hidden className="size-6 text-muted-foreground/40" />}
                          <p className={`break-words text-sm leading-snug ${player ? "font-bold" : "text-muted-foreground"}`}>{player?.name ?? "Chưa chọn"}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`border-t pt-3 ${isRolling ? "animate-pulse" : ""}`}>
                    <p className="break-words text-sm font-semibold leading-snug">{team?.name ?? "Chưa chọn đội"}</p>
                    {team ? <p className="mt-1 text-[11px] text-muted-foreground">Tier {team.tier} · {team.rating}</p> : null}
                  </div>
                </div>
                {sideIndex === 0 ? <span className="mt-10 text-xs font-black italic text-muted-foreground/60">VS</span> : null}
              </Fragment>
            );
          })}
        </div>

        <div className="space-y-4 border-t p-4">
          {tournamentFixture ? (
            <p className="text-xs leading-relaxed text-muted-foreground">Trận thuộc giải đấu, không tính Điểm Arena hay BXH giao hữu.</p>
          ) : (
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isRanked}
                onChange={(event) => setIsRanked(event.target.checked)}
                disabled={isPending || isRolling}
                className="mt-0.5 size-4 accent-primary"
              />
              <span className="space-y-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold"><ArenaRankMark className="size-4" /> Tính Điểm Arena</span>
                <span className="block text-xs text-muted-foreground">{isRanked ? "Cập nhật BXH giao hữu sau khi có kết quả." : "Chỉ lưu lịch sử, không tính BXH giao hữu."}</span>
              </span>
            </label>
          )}
          {matchSetupMode === "RANDOM" && !hasAssignedTournamentTeams && rerollCount > 0 ? (
            <p className="text-xs text-muted-foreground">Đã quay lại {rerollCount} lần.</p>
          ) : null}
          {state.status === "error" ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{state.message}</p>
          ) : null}
          <StartMatchButton disabled={!selectionReady || isRolling} />
          {!selectionReady ? <p className="text-center text-xs text-muted-foreground">Chọn đủ {requiredPlayers} người và 2 đội để bắt đầu.</p> : null}
        </div>
      </aside>
    </form>
  );
}
