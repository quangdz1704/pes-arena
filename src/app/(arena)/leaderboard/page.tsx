import Link from "next/link";
import {
  Crown,
  Medal,
  Swords,
  Trophy,
} from "lucide-react";

import {
  ArenaRankMark,
  ArenaRatingMovement,
} from "@/components/shared/arena-rank-mark";
import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isDatabaseConfigured } from "@/db";
import type {
  LeaderboardMatchMode,
  LeaderboardPeriod,
} from "@/services/leaderboard";
import { getLeaderboard } from "@/services/leaderboard.service";

export const dynamic = "force-dynamic";

const periods = [
  ["ALL", "Tất cả"],
  ["DAY", "1 ngày"],
  ["SEVEN_DAYS", "7 ngày"],
  ["THIRTY_DAYS", "30 ngày"],
] as const satisfies readonly [LeaderboardPeriod, string][];

const modes = [
  ["ALL", "Mọi kèo"],
  ["ONE_V_ONE", "1v1"],
  ["TWO_V_TWO", "2v2"],
] as const satisfies readonly [LeaderboardMatchMode, string][];

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function readFilter<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
) {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function filterHref(
  filters: { period: LeaderboardPeriod; matchMode: LeaderboardMatchMode },
  patch: Partial<typeof filters>,
) {
  const next = { ...filters, ...patch };
  return `/leaderboard?period=${next.period}&mode=${next.matchMode}`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const filters = {
    period: readFilter(
      params.period,
      periods.map(([value]) => value),
      "ALL",
    ),
    matchMode: readFilter(
      params.mode,
      modes.map(([value]) => value),
      "ALL",
    ),
  };
  const databaseReady = isDatabaseConfigured();
  const entries = databaseReady
    ? await getLeaderboard({ ...filters, sort: "RATING" })
    : [];
  const featuredEntries = entries.slice(0, 3);
  const periodLabel = getPeriodLabel(filters.period);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeading
        eyebrow="Bảng sức mạnh"
        title="Bảng xếp hạng giao hữu"
        description="Điểm Arena tính cả sức mạnh đối thủ, nên không phải cứ đá nhiều là đứng cao."
      />

      {!databaseReady ? <DatabaseSetupNotice /> : null}

      {databaseReady ? (
        <>
          <Card className="border-white/10 bg-card/80">
            <CardContent className="space-y-5 p-5">
              <FilterGroup
                label="Khoảng thời gian"
                options={periods}
                active={filters.period}
                href={(period) => filterHref(filters, { period })}
              />
              <FilterGroup
                label="Chế độ"
                options={modes}
                active={filters.matchMode}
                href={(matchMode) => filterHref(filters, { matchMode })}
              />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="flex items-center gap-2 font-black text-primary">
                  <ArenaRankMark /> Điểm Arena
                </p>
                <p className="mt-1 text-muted-foreground">
                  Thắng đối thủ mạnh sẽ nhận nhiều điểm hơn.
                </p>
              </div>
              <div>
                <p className="font-black text-primary">Xếp hạng chính thức</p>
                <p className="mt-1 text-muted-foreground">
                  Cần hoàn tất 5 trận giao hữu để có hạng.
                </p>
              </div>
              <div>
                <p className="font-black text-primary">Ưu tiên đối đầu</p>
                <p className="mt-1 text-muted-foreground">
                  Khi bằng điểm và đã gặp nhau từ 2 trận.
                </p>
              </div>
            </CardContent>
          </Card>

          {entries.length === 0 ? (
            <Card className="border-dashed border-white/12 bg-transparent">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Medal className="mb-4 size-10 text-muted-foreground" />
                <h2 className="font-bold">
                  Chưa đủ trận để phân định ai là vua, ai là bao cát.
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cần đá trận giao hữu tự tạo để nhận Điểm Arena.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <section
                className={`grid gap-3 sm:grid-cols-2 ${featuredEntries.length === 3 ? "lg:grid-cols-3" : ""}`}
              >
                {featuredEntries.map((entry, index) => {
                  const Icon =
                    index === 0 ? Crown : index === 1 ? Trophy : Medal;
                  return (
                    <Card
                      key={entry.playerId}
                      className={
                        index === 0
                          ? "overflow-hidden border-primary/30 bg-primary/[0.055]"
                          : "border-white/10 bg-card/80"
                      }
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="size-11">
                              <AvatarImage
                                alt={entry.playerName}
                                src={entry.avatarUrl ?? undefined}
                              />
                              <AvatarFallback className="bg-primary/10 font-bold text-primary">
                                {initials(entry.playerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-lg font-black">
                                {entry.playerName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {entry.isProvisional
                                  ? `Còn ${5 - entry.ratedMatches} trận để chốt hạng`
                                  : `Hạng #${entry.rank}`}
                              </p>
                            </div>
                          </div>
                          <span
                            className={
                              index === 0
                                ? "flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
                                : "flex size-9 shrink-0 items-center justify-center rounded-full border border-amber-300/15 bg-amber-300/8 text-amber-300"
                            }
                          >
                            <Icon className="size-5" />
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
                          <div>
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              <ArenaRankMark className="size-4" /> Điểm Arena
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-3xl font-black leading-none tracking-tight tabular-nums">
                                {entry.rating.toLocaleString("vi-VN")}
                              </span>
                              <ArenaRatingMovement delta={entry.ratingDelta} />
                            </div>
                          </div>
                          <p className="shrink-0 whitespace-nowrap pb-0.5 text-right text-[11px] text-muted-foreground">
                            Kỳ tính: {periodLabel}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </section>

              <div className="leaderboard-mobile-list space-y-3">
                {entries.map((entry) => (
                  <Card
                    className="border-white/10 bg-card/80"
                    key={entry.playerId}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              alt={entry.playerName}
                              src={entry.avatarUrl ?? undefined}
                            />
                            <AvatarFallback className="bg-primary/10 font-bold text-primary">
                              {initials(entry.playerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">
                              {entry.isProvisional
                                ? `Còn ${5 - entry.ratedMatches} trận để chốt hạng`
                                : `Hạng #${entry.rank}`}
                            </p>
                            <p className="truncate text-lg font-black">
                              {entry.playerName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/8 bg-background/35 px-3 py-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <ArenaRankMark className="size-4" /> Điểm Arena
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black leading-none tracking-tight tabular-nums">
                            {entry.rating.toLocaleString("vi-VN")}
                          </span>
                          <ArenaRatingMovement delta={entry.ratingDelta} />
                        </div>
                      </div>
                      <div className="leaderboard-mobile-stats mt-3 gap-2 border-t border-white/10 pt-3 text-center text-sm">
                        <Stat label="Trận" value={entry.matches} />
                        <Stat
                          label="T-W-L"
                          value={`${entry.wins}-${entry.draws}-${entry.losses}`}
                        />
                        <Stat
                          label="GD"
                          value={`${entry.goalDifference > 0 ? "+" : ""}${entry.goalDifference}`}
                          tone={
                            entry.goalDifference > 0
                              ? "text-emerald-400"
                              : entry.goalDifference < 0
                                ? "text-rose-400"
                                : undefined
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="leaderboard-table">
                <Card className="border-white/10 bg-card/80">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Người chơi</TableHead>
                          <TableHead className="bg-primary/[0.045]">
                            <span className="flex items-center gap-1.5 font-bold text-foreground">
                              <ArenaRankMark className="size-4" /> Điểm Arena
                            </span>
                          </TableHead>
                          <TableHead>Trận</TableHead>
                          <TableHead>Thắng</TableHead>
                          <TableHead>Hòa</TableHead>
                          <TableHead>Thua</TableHead>
                          <TableHead>Winrate</TableHead>
                          <TableHead>GF</TableHead>
                          <TableHead>GA</TableHead>
                          <TableHead>GD</TableHead>
                          <TableHead>Chuỗi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.playerId}>
                            <TableCell className="font-black text-primary">
                              {entry.isProvisional ? "Tạm" : entry.rank}
                            </TableCell>
                            <TableCell className="font-bold">
                              <div className="flex items-center gap-2">
                                <Avatar size="sm">
                                  <AvatarImage
                                    alt={entry.playerName}
                                    src={entry.avatarUrl ?? undefined}
                                  />
                                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                                    {initials(entry.playerName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{entry.playerName}</span>
                              </div>
                            </TableCell>
                            <TableCell
                              className="bg-primary/[0.035]"
                            >
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-xl font-black tracking-tight text-foreground tabular-nums">
                                  {entry.rating.toLocaleString("vi-VN")}
                                </span>
                                <ArenaRatingMovement delta={entry.ratingDelta} />
                              </div>
                            </TableCell>
                            <TableCell>{entry.matches}</TableCell>
                            <TableCell>{entry.wins}</TableCell>
                            <TableCell>{entry.draws}</TableCell>
                            <TableCell>{entry.losses}</TableCell>
                            <TableCell>{entry.winRate}%</TableCell>
                            <TableCell>{entry.goalsFor}</TableCell>
                            <TableCell>{entry.goalsAgainst}</TableCell>
                            <TableCell
                              className={
                                entry.goalDifference > 0
                                  ? "text-emerald-400"
                                  : entry.goalDifference < 0
                                    ? "text-rose-400"
                                    : undefined
                              }
                            >
                              {entry.goalDifference > 0 ? "+" : ""}
                              {entry.goalDifference}
                            </TableCell>
                            <TableCell>
                              {entry.currentStreak > 0 ? (
                                <Badge className="gap-1">
                                  <Swords className="size-3" />{" "}
                                  {entry.currentStreak}W
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  active,
  href,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  active: T;
  href: (value: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {options.map(([value, label]) => (
        <Link
          className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${active === value ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"}`}
          href={href(value)}
          key={value}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`truncate font-bold ${tone ?? ""}`}>{value}</p>
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function getPeriodLabel(period: LeaderboardPeriod) {
  return period === "DAY"
    ? "hôm nay"
    : period === "SEVEN_DAYS"
      ? "trong 7 ngày"
      : period === "THIRTY_DAYS"
        ? "trong 30 ngày"
        : "toàn thời gian";
}
