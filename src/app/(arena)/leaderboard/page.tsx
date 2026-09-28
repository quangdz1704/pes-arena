import Link from "next/link";
import {
  Crown,
  Medal,
  Minus,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { ArenaRankMark } from "@/components/shared/arena-rank-mark";
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
                <p className="font-black text-primary">Điểm Arena</p>
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
              <section className="grid gap-3 sm:grid-cols-3">
                {entries.slice(0, 3).map((entry, index) => {
                  const Icon =
                    index === 0 ? Crown : index === 1 ? Trophy : Medal;
                  return (
                    <Card
                      key={entry.playerId}
                      className={
                        index === 0
                          ? "border-primary/40 bg-primary/8"
                          : "border-white/10 bg-card/80"
                      }
                    >
                      <CardContent className="flex items-center gap-4 p-5">
                        <Icon
                          className={
                            index === 0
                              ? "size-8 text-primary"
                              : "size-7 text-amber-300"
                          }
                        />
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
                            <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground">
                              {entry.isProvisional
                                ? `ĐANG HIỆU CHỈNH · CÒN ${5 - entry.ratedMatches} TRẬN`
                                : `HẠNG ${entry.rank}`}
                            </p>
                            <p className="truncate text-lg font-black">
                              {entry.playerName}
                            </p>
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <ArenaRankMark className="size-4" />
                              {entry.rating.toLocaleString("vi-VN")} Điểm Arena
                              <RatingMovement delta={entry.ratingDelta} />
                              <span>· {periodLabel}</span>
                            </p>
                          </div>
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
                      <div className="flex items-start justify-between gap-3">
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
                            <p className="text-xs font-bold tracking-[0.16em] text-primary">
                              {entry.isProvisional
                                ? `CÒN ${5 - entry.ratedMatches} TRẬN ĐỂ XẾP HẠNG`
                                : `HẠNG ${entry.rank}`}
                            </p>
                            <p className="truncate text-lg font-black">
                              {entry.playerName}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-right">
                          <ArenaRankMark />
                          <div>
                            <p className="flex items-center justify-end gap-1 font-black text-primary">
                              {entry.rating.toLocaleString("vi-VN")}
                              <RatingMovement delta={entry.ratingDelta} />
                            </p>
                            <p className="text-xs text-muted-foreground">Điểm Arena</p>
                          </div>
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
                          <TableHead className="rounded-t-lg bg-primary/12 text-primary">
                            <span className="flex items-center gap-2">
                              <ArenaRankMark /> Điểm Arena
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
                        {entries.map((entry, index) => (
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
                              className={`bg-primary/8 ${index === entries.length - 1 ? "rounded-b-lg" : ""}`}
                            >
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-xl font-black tracking-tight text-primary">
                                  {entry.rating.toLocaleString("vi-VN")}
                                </span>
                                <RatingMovement delta={entry.ratingDelta} />
                                {entry.isProvisional ? (
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                    mới
                                  </span>
                                ) : null}
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

function RatingMovement({ delta }: { delta: number }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone = delta > 0 ? "text-primary" : delta < 0 ? "text-rose-400" : "text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-black ${tone}`}
      title={delta > 0 ? `Tăng ${delta} điểm` : delta < 0 ? `Giảm ${Math.abs(delta)} điểm` : "Không đổi"}
    >
      <Icon className="size-3.5" />
      {Math.abs(delta)}
    </span>
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
