"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Dices, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import {
  buildTournamentTeamPlan,
  getSameTierTeamGroups,
  pickSameTierTeams,
  randomizeFixtureTeams,
  type FixtureTeamAssignment,
} from "@/services/tournament-team-plan";

import { createTournamentAction } from "./actions";

type PlayerOption = { id: string; name: string };
type TeamOption = {
  id: string;
  name: string;
  tier: "S" | "A" | "B" | "C";
  rating: number;
};
type PoolOption = {
  id: string;
  name: string;
  emoji: string | null;
  teams: TeamOption[];
};
type MatchMode = "ONE_V_ONE" | "TWO_V_TWO";
type TournamentType = "LEAGUE" | "KNOCKOUT";
type TeamSelectionMode = "RANDOM" | "MANUAL";

const fieldClass =
  "h-10 w-full min-w-0 rounded-lg border border-white/10 bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
const captionClass = "text-xs font-semibold text-muted-foreground";

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      aria-label={label}
      className="flex min-w-0 rounded-lg bg-white/5 p-1"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={
            "min-w-0 flex-1 rounded-md whitespace-nowrap px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3 sm:text-sm " +
            (value === option.value
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground")
          }
          key={option.value}
          onClick={() => {
            if (value !== option.value) onChange(option.value);
          }}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function TournamentForm({
  onSuccess,
  players,
  pools,
}: {
  onSuccess: () => void;
  players: PlayerOption[];
  pools: PoolOption[];
}) {
  const router = useRouter();
  const [type, setType] = useState<TournamentType>("LEAGUE");
  const [mode, setMode] = useState<MatchMode>("ONE_V_ONE");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [pairs, setPairs] = useState<string[][]>([]);
  const [firstPlayerId, setFirstPlayerId] = useState("");
  const [secondPlayerId, setSecondPlayerId] = useState("");
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [teamSelectionMode, setTeamSelectionMode] =
    useState<TeamSelectionMode>("RANDOM");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [assignTeams, setAssignTeams] = useState(false);
  const [teamAssignmentScope, setTeamAssignmentScope] = useState<
    "FIXED" | "PER_MATCH"
  >("FIXED");
  const [fixtureTeams, setFixtureTeams] = useState<FixtureTeamAssignment[]>([]);
  const [isHomeAndAway, setIsHomeAndAway] = useState(true);
  const [state, action, pending] = useActionState(
    createTournamentAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      onSuccess();
      router.refresh();
    }
    if (state.status === "error") toast.error(state.message);
  }, [onSuccess, router, state]);

  const usedPlayerIds = mode === "ONE_V_ONE" ? selectedPlayerIds : pairs.flat();
  const competitors =
    mode === "ONE_V_ONE" ? selectedPlayerIds.map((id) => [id]) : pairs;
  const selectedPool = pools.find((pool) => pool.id === poolId);
  const labels = useMemo(
    () =>
      competitors.map((group) =>
        group
          .map((id) => players.find((player) => player.id === id)?.name ?? "?")
          .join(" + "),
      ),
    [competitors, players],
  );
  const assignedTeamIds = teamIds.slice(0, competitors.length);
  const fixturePlan = buildTournamentTeamPlan(
    type,
    competitors.length,
    isHomeAndAway,
  );
  const teamsReady =
    !assignTeams ||
    (teamAssignmentScope === "FIXED"
      ? assignedTeamIds.length === competitors.length &&
        Array.from(assignedTeamIds).every(Boolean) &&
        new Set(assignedTeamIds).size === competitors.length
      : fixturePlan.length > 0 &&
        fixturePlan.every((fixture) =>
          fixtureTeams.some(
            (assignment) =>
              assignment.round === fixture.round &&
              assignment.position === fixture.position &&
              assignment.homeTeamId &&
              assignment.awayTeamId &&
              assignment.homeTeamId !== assignment.awayTeamId,
          ),
        ));
  const fixtureCount = fixturePlan.length;
  const randomTeamCount =
    teamAssignmentScope === "FIXED" ? competitors.length : 2;
  const canRandomizeTeams =
    fixtureCount > 0 &&
    getSameTierTeamGroups(selectedPool?.teams ?? [], randomTeamCount).length >
      0;

  const resetAssignments = () => {
    setTeamIds([]);
    setFixtureTeams([]);
  };
  const resetMode = (nextMode: MatchMode) => {
    setMode(nextMode);
    setSelectedPlayerIds([]);
    setPairs([]);
    resetAssignments();
  };
  const addPair = () => {
    if (
      !firstPlayerId ||
      !secondPlayerId ||
      firstPlayerId === secondPlayerId ||
      usedPlayerIds.includes(firstPlayerId) ||
      usedPlayerIds.includes(secondPlayerId)
    )
      return;
    setPairs((current) => [...current, [firstPlayerId, secondPlayerId]]);
    setFirstPlayerId("");
    setSecondPlayerId("");
    resetAssignments();
  };
  const randomizeTeams = () => {
    if (!selectedPool || !canRandomizeTeams) return;
    if (teamAssignmentScope === "PER_MATCH")
      setFixtureTeams(randomizeFixtureTeams(fixturePlan, selectedPool.teams));
    else
      setTeamIds(
        pickSameTierTeams(selectedPool.teams, competitors.length).map(
          (team) => team.id,
        ),
      );
  };
  const setManualTeam = (index: number, teamId: string) =>
    setTeamIds((current) => {
      const next = [...current];
      next[index] = teamId;
      return next;
    });
  const setFixtureTeam = (
    round: number,
    position: number,
    side: "homeTeamId" | "awayTeamId",
    teamId: string,
  ) =>
    setFixtureTeams((current) => {
      const assignment = current.find(
        (fixture) => fixture.round === round && fixture.position === position,
      ) ?? { round, position, homeTeamId: "", awayTeamId: "" };
      return [
        ...current.filter(
          (fixture) => fixture.round !== round || fixture.position !== position,
        ),
        { ...assignment, [side]: teamId },
      ];
    });

  const roundNumbers = [
    ...new Set(fixturePlan.map((fixture) => fixture.round)),
  ];
  const getTeam = (id: string | undefined) =>
    selectedPool?.teams.find((team) => team.id === id);
  const getTeamName = (id: string | undefined) =>
    selectedPool?.teams.find((team) => team.id === id)?.name ?? "Chưa chọn";
  const getFixtureLabel = (
    competitor: number | null,
    round: number,
    position: number,
    side: "home" | "away",
  ) => {
    if (type === "LEAGUE") return labels[competitor!];
    if (competitor !== null) return "Hạt giống #" + (competitor + 1);
    return (
      "Thắng trận " +
      (position * 2 - (side === "home" ? 1 : 0)) +
      " vòng " +
      (round - 1)
    );
  };
  const invalidKnockoutSize =
    type === "KNOCKOUT" && ![2, 4, 8].includes(competitors.length);

  return (
    <form action={action} className="flex min-h-0 flex-col">
      <input name="type" type="hidden" value={type} />
      <input name="matchMode" type="hidden" value={mode} />
      <input
        name="competitors"
        type="hidden"
        value={JSON.stringify(competitors)}
      />
      <input
        name="teamPoolId"
        type="hidden"
        value={assignTeams ? poolId : ""}
      />
      <input
        name="teamAssignmentScope"
        type="hidden"
        value={teamAssignmentScope}
      />
      <input
        name="fixtureTeams"
        type="hidden"
        value={JSON.stringify(
          assignTeams && teamAssignmentScope === "PER_MATCH"
            ? fixtureTeams
            : [],
        )}
      />
      <input
        name="teamIds"
        type="hidden"
        value={JSON.stringify(
          assignTeams && teamAssignmentScope === "FIXED" ? assignedTeamIds : [],
        )}
      />
      <input
        name="isHomeAndAway"
        type="hidden"
        value={String(type === "LEAGUE" && isHomeAndAway)}
      />

      <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
        <section aria-label="Thiết lập giải" className="space-y-3">
          <label className="grid gap-1.5">
            <span className={captionClass}>Tên giải</span>
            <input
              className={fieldClass}
              maxLength={150}
              minLength={3}
              name="name"
              placeholder="Ví dụ: Cup cuối tuần"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className={captionClass}>Thể thức</p>
              <SegmentedControl
                label="Thể thức"
                onChange={(value) => {
                  setType(value);
                  resetAssignments();
                }}
                options={[
                  { value: "LEAGUE", label: "League" },
                  { value: "KNOCKOUT", label: "Knockout" },
                ]}
                value={type}
              />
            </div>
            <div className="space-y-1.5">
              <p className={captionClass}>Chế độ</p>
              <SegmentedControl
                label="Chế độ"
                onChange={resetMode}
                options={[
                  { value: "ONE_V_ONE", label: "1v1" },
                  { value: "TWO_V_TWO", label: "2v2" },
                ]}
                value={mode}
              />
            </div>
          </div>
          {type === "LEAGUE" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                checked={isHomeAndAway}
                className="size-4 accent-primary"
                onChange={(event) => {
                  setIsHomeAndAway(event.target.checked);
                  resetAssignments();
                }}
                type="checkbox"
              />
              Lượt đi & lượt về
              <span className="ml-auto text-xs text-muted-foreground">
                2 lần gặp nhau
              </span>
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">
              Loại trực tiếp · Hạt giống theo Điểm Arena
            </p>
          )}
        </section>

        <section
          aria-label="Người tham gia"
          className="space-y-3 border-t border-white/10 pt-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Người tham gia</h3>
            <span className="text-xs text-muted-foreground">
              {competitors.length}/{8} {mode === "ONE_V_ONE" ? "người" : "cặp"}
            </span>
          </div>
          {mode === "ONE_V_ONE" ? (
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {players.map((player) => {
                const selected = selectedPlayerIds.includes(player.id);
                return (
                  <button
                    aria-pressed={selected}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 " +
                      (selected
                        ? "bg-primary/15 text-primary"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground")
                    }
                    disabled={!selected && selectedPlayerIds.length >= 8}
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayerIds((current) =>
                        selected
                          ? current.filter((id) => id !== player.id)
                          : [...current, player.id],
                      );
                      resetAssignments();
                    }}
                    type="button"
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                    {player.name}
                  </button>
                );
              })}
              {!players.length ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có người chơi đang hoạt động.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <select
                  aria-label="Người chơi thứ nhất"
                  className={fieldClass}
                  onChange={(event) => setFirstPlayerId(event.target.value)}
                  value={firstPlayerId}
                >
                  <option value="">Người thứ nhất</option>
                  {players.map((player) => (
                    <option
                      disabled={
                        usedPlayerIds.includes(player.id) ||
                        player.id === secondPlayerId
                      }
                      key={player.id}
                      value={player.id}
                    >
                      {player.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Người chơi thứ hai"
                  className={fieldClass}
                  onChange={(event) => setSecondPlayerId(event.target.value)}
                  value={secondPlayerId}
                >
                  <option value="">Người thứ hai</option>
                  {players.map((player) => (
                    <option
                      disabled={
                        usedPlayerIds.includes(player.id) ||
                        player.id === firstPlayerId
                      }
                      key={player.id}
                      value={player.id}
                    >
                      {player.name}
                    </option>
                  ))}
                </select>
                <Button
                  className="col-span-2 sm:col-span-1"
                  disabled={
                    !firstPlayerId || !secondPlayerId || pairs.length >= 8
                  }
                  onClick={addPair}
                  type="button"
                  variant="secondary"
                >
                  Thêm cặp
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pairs.map((pair, index) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-primary"
                    key={pair.join("-")}
                  >
                    {labels[index]}
                    <button
                      aria-label={"Bỏ cặp " + labels[index]}
                      className="rounded-full p-1 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => {
                        setPairs((current) =>
                          current.filter((_, pairIndex) => pairIndex !== index),
                        );
                        resetAssignments();
                      }}
                      type="button"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section
          aria-label="Gán đội bóng"
          className="space-y-3 border-t border-white/10 pt-4"
        >
          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                checked={assignTeams}
                className="size-4 accent-primary"
                onChange={(event) => {
                  setAssignTeams(event.target.checked);
                  resetAssignments();
                }}
                type="checkbox"
              />
              Gán đội khi tạo giải
            </label>
            <span className="text-xs text-muted-foreground">
              {assignTeams
                ? teamsReady && competitors.length >= 2
                  ? "Đã gán đủ"
                  : "Chưa gán đủ"
                : "Tùy chọn"}
            </span>
          </div>
          {!assignTeams ? (
            <p className="text-xs text-muted-foreground">
              Không bật: chọn hoặc random đội khi vào từng trận.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className={captionClass}>Cách gán</span>
                  <select
                    className={fieldClass}
                    onChange={(event) => {
                      setTeamAssignmentScope(
                        event.target.value as "FIXED" | "PER_MATCH",
                      );
                      resetAssignments();
                    }}
                    value={teamAssignmentScope}
                  >
                    <option value="FIXED">Cố định cả giải</option>
                    <option value="PER_MATCH">Theo từng trận</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className={captionClass}>Nhóm đội</span>
                  <select
                    className={fieldClass}
                    onChange={(event) => {
                      setPoolId(event.target.value);
                      resetAssignments();
                    }}
                    value={poolId}
                  >
                    {!pools.length ? (
                      <option value="">Chưa có nhóm đội</option>
                    ) : null}
                    {pools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.emoji ?? "⚽"} {pool.name} · {pool.teams.length}{" "}
                        đội
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  label="Chọn đội"
                  onChange={(value) => {
                    setTeamSelectionMode(value);
                    resetAssignments();
                  }}
                  options={[
                    { value: "RANDOM", label: "Random" },
                    { value: "MANUAL", label: "Thủ công" },
                  ]}
                  value={teamSelectionMode}
                />
                {teamSelectionMode === "RANDOM" ? (
                  <Button
                    className="ml-auto h-9"
                    disabled={!canRandomizeTeams}
                    onClick={randomizeTeams}
                    type="button"
                    variant="secondary"
                  >
                    <Dices className="size-4" />
                    {assignedTeamIds.length || fixtureTeams.length
                      ? "Random lại"
                      : "Random đội"}
                  </Button>
                ) : null}
              </div>
              <p
                className={
                  "text-xs " +
                  (teamSelectionMode === "RANDOM" &&
                  fixtureCount > 0 &&
                  !canRandomizeTeams
                    ? "text-amber-300"
                    : "text-muted-foreground")
                }
              >
                {teamSelectionMode === "RANDOM" &&
                fixtureCount > 0 &&
                !canRandomizeTeams
                  ? "Cần " +
                    randomTeamCount +
                    " đội cùng tier. Đổi nhóm đội hoặc chọn thủ công."
                  : teamAssignmentScope === "FIXED"
                    ? "Mỗi người/cặp giữ một đội cả giải. Random luôn cùng tier, không trùng."
                    : "Mỗi trận có đội riêng. Random hai đội cùng tier, ưu tiên tránh lặp."}
              </p>
              {teamAssignmentScope === "PER_MATCH" && type === "KNOCKOUT" ? (
                <p className="text-xs text-muted-foreground">
                  Các vòng sau gán theo ô nhánh đấu; người đi tiếp nhận đội đã
                  chọn.
                </p>
              ) : null}

              {teamAssignmentScope === "FIXED" &&
              (teamSelectionMode === "MANUAL" || assignedTeamIds.length > 0) ? (
                <div className="grid gap-x-5 sm:grid-cols-2">
                  {labels.map((label, index) => (
                    <div
                      className="flex min-w-0 items-center justify-between gap-3 border-b border-white/5 py-2"
                      key={competitors[index]!.join("-")}
                    >
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {label}
                      </span>
                      {teamSelectionMode === "MANUAL" ? (
                        <select
                          aria-label={"Đội cố định của " + label}
                          className={fieldClass + " max-w-[60%]"}
                          onChange={(event) =>
                            setManualTeam(index, event.target.value)
                          }
                          value={assignedTeamIds[index] ?? ""}
                        >
                          <option value="">Chọn đội</option>
                          {selectedPool?.teams.map((team) => (
                            <option
                              disabled={
                                assignedTeamIds.includes(team.id) &&
                                assignedTeamIds[index] !== team.id
                              }
                              key={team.id}
                              value={team.id}
                            >
                              {team.name} · {team.tier}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="min-w-0 truncate text-right text-xs text-primary"
                          title={getTeamName(assignedTeamIds[index])}
                        >
                          {getTeamName(assignedTeamIds[index])}{" "}
                          <span className="text-muted-foreground">
                            ·{" "}
                            {
                              selectedPool?.teams.find(
                                (team) => team.id === assignedTeamIds[index],
                              )?.tier
                            }
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {teamAssignmentScope === "PER_MATCH" &&
              (teamSelectionMode === "MANUAL" || fixtureTeams.length > 0) ? (
                <div className="divide-y divide-white/10">
                  {roundNumbers.map((round) => {
                    const fixtures = fixturePlan.filter(
                      (fixture) => fixture.round === round,
                    );
                    const filled = fixtures.filter((fixture) =>
                      fixtureTeams.some(
                        (assignment) =>
                          assignment.round === round &&
                          assignment.position === fixture.position &&
                          assignment.homeTeamId &&
                          assignment.awayTeamId,
                      ),
                    ).length;
                    return (
                      <details
                        className="group"
                        key={round}
                        open={teamSelectionMode === "MANUAL" && round === 1}
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-2 py-2.5 text-xs [&::-webkit-details-marker]:hidden">
                          <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                          <b>Vòng {round}</b>
                          <span className="ml-auto text-muted-foreground">
                            {filled}/{fixtures.length} trận đã gán
                          </span>
                        </summary>
                        <div className="divide-y divide-white/5 pb-2">
                          {fixtures.map((fixture) => {
                            const assignment = fixtureTeams.find(
                              (item) =>
                                item.round === round &&
                                item.position === fixture.position,
                            );
                            const homeLabel = getFixtureLabel(
                              fixture.home,
                              round,
                              fixture.position,
                              "home",
                            );
                            const awayLabel = getFixtureLabel(
                              fixture.away,
                              round,
                              fixture.position,
                              "away",
                            );
                            return (
                              <div
                                className="grid grid-cols-2 gap-3 py-2"
                                key={fixture.position}
                              >
                                {(
                                  [
                                    ["homeTeamId", homeLabel, "awayTeamId"],
                                    ["awayTeamId", awayLabel, "homeTeamId"],
                                  ] as const
                                ).map(([side, label, opposite]) => (
                                  <div className="min-w-0 space-y-1" key={side}>
                                    <p
                                      className="truncate text-xs font-semibold"
                                      title={label}
                                    >
                                      {label}
                                    </p>
                                    {teamSelectionMode === "MANUAL" ? (
                                      <select
                                        aria-label={
                                          "Đội của " +
                                          label +
                                          ", vòng " +
                                          round +
                                          ", trận " +
                                          fixture.position
                                        }
                                        className={fieldClass + " px-2"}
                                        onChange={(event) =>
                                          setFixtureTeam(
                                            round,
                                            fixture.position,
                                            side,
                                            event.target.value,
                                          )
                                        }
                                        value={assignment?.[side] ?? ""}
                                      >
                                        <option value="">Chọn đội</option>
                                        {selectedPool?.teams.map((team) => (
                                          <option
                                            disabled={
                                              assignment?.[opposite] === team.id
                                            }
                                            key={team.id}
                                            value={team.id}
                                          >
                                            {team.name} · {team.tier}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <p
                                        className="truncate text-xs text-primary"
                                        title={getTeamName(assignment?.[side])}
                                      >
                                        {getTeamName(assignment?.[side])}
                                        {" · "}
                                        {getTeam(assignment?.[side])?.tier}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-popover px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground" aria-live="polite">
          <p className="font-semibold text-foreground">
            {competitors.length} đối thủ · {fixtureCount} trận
            {type === "LEAGUE" && isHomeAndAway ? " · đi & về" : ""}
          </p>
          {competitors.length < 2 ? (
            <p className="mt-1">Chọn ít nhất 2 đối thủ để tạo giải.</p>
          ) : invalidKnockoutSize ? (
            <p className="mt-1 text-amber-300">
              Knockout cần 2, 4 hoặc 8 đối thủ.
            </p>
          ) : assignTeams && !teamsReady ? (
            <p className="mt-1 text-amber-300">
              Gán đủ đội trước khi tạo giải.
            </p>
          ) : null}
        </div>
        <Button
          className="shrink-0 font-bold"
          disabled={
            pending ||
            competitors.length > 8 ||
            competitors.length < 2 ||
            !teamsReady ||
            (assignTeams && !poolId) ||
            invalidKnockoutSize
          }
          type="submit"
        >
          {pending ? "Đang tạo…" : "Tạo giải"}
        </Button>
      </div>
    </form>
  );
}
