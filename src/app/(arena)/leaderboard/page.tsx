import Link from "next/link";
import { Crown, Medal, Swords, Trophy } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
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
  LeaderboardSort,
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

const sorts = [
  ["WINS", "Thắng"],
  ["WINRATE", "Winrate"],
  ["MATCHES", "Số trận"],
  ["GF", "GF"],
] as const satisfies readonly [LeaderboardSort, string][];

function readFilter<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T) {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function filterHref(filters: { period: LeaderboardPeriod; matchMode: LeaderboardMatchMode; sort: LeaderboardSort }, patch: Partial<typeof filters>) {
  const next = { ...filters, ...patch };
  return `/leaderboard?period=${next.period}&mode=${next.matchMode}&sort=${next.sort}`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; mode?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const filters = {
    period: readFilter(params.period, periods.map(([value]) => value), "ALL"),
    matchMode: readFilter(params.mode, modes.map(([value]) => value), "ALL"),
    sort: readFilter(params.sort, sorts.map(([value]) => value), "WINS"),
  };
  const databaseReady = isDatabaseConfigured();
  const entries = databaseReady ? await getLeaderboard(filters) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeading
        eyebrow="Thống kê"
        title="Bảng xếp hạng"
        description="Thắng thì lên đỉnh. Thua thì ít nhất cũng có số liệu để chối."
      />

      {!databaseReady ? <DatabaseSetupNotice /> : null}

      {databaseReady ? (
        <>
          <Card className="border-white/10 bg-card/80">
            <CardContent className="space-y-5 p-5">
              <FilterGroup label="Khoảng thời gian" options={periods} active={filters.period} href={(period) => filterHref(filters, { period })} />
              <FilterGroup label="Chế độ" options={modes} active={filters.matchMode} href={(matchMode) => filterHref(filters, { matchMode })} />
              <FilterGroup label="Xếp theo" options={sorts} active={filters.sort} href={(sort) => filterHref(filters, { sort })} />
            </CardContent>
          </Card>

          {entries.length === 0 ? (
            <Card className="border-dashed border-white/12 bg-transparent">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Medal className="mb-4 size-10 text-muted-foreground" />
                <h2 className="font-bold">Chưa đủ trận để phân định ai là vua, ai là bao cát.</h2>
                <p className="mt-1 text-sm text-muted-foreground">Chỉ các trận xếp hạng đã hoàn tất mới được tính vào BXH.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                {entries.slice(0, 3).map((entry, index) => {
                  const Icon = index === 0 ? Crown : index === 1 ? Trophy : Medal;
                  return (
                    <Card key={entry.playerId} className={index === 0 ? "border-primary/40 bg-primary/8" : "border-white/10 bg-card/80"}>
                      <CardContent className="flex items-center gap-4 p-5">
                        <Icon className={index === 0 ? "size-8 text-primary" : "size-7 text-amber-300"} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground">HẠNG {entry.rank}</p>
                          <p className="truncate text-lg font-black">{entry.playerName}</p>
                          <p className="text-sm text-muted-foreground">{entry.wins} thắng · {entry.winRate}% winrate</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </section>

              <Card className="border-white/10 bg-card/80">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead><TableHead>Người chơi</TableHead><TableHead>Trận</TableHead><TableHead>Thắng</TableHead><TableHead>Hòa</TableHead><TableHead>Thua</TableHead><TableHead>Winrate</TableHead><TableHead>GF</TableHead><TableHead>GA</TableHead><TableHead>GD</TableHead><TableHead>Chuỗi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.playerId}>
                          <TableCell className="font-black text-primary">{entry.rank}</TableCell>
                          <TableCell className="font-bold">{entry.playerName}</TableCell>
                          <TableCell>{entry.matches}</TableCell><TableCell>{entry.wins}</TableCell><TableCell>{entry.draws}</TableCell><TableCell>{entry.losses}</TableCell>
                          <TableCell>{entry.winRate}%</TableCell><TableCell>{entry.goalsFor}</TableCell><TableCell>{entry.goalsAgainst}</TableCell>
                          <TableCell className={entry.goalDifference > 0 ? "text-emerald-400" : entry.goalDifference < 0 ? "text-rose-400" : undefined}>{entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}</TableCell>
                          <TableCell>{entry.currentStreak > 0 ? <Badge className="gap-1"><Swords className="size-3" /> {entry.currentStreak}W</Badge> : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
      <span className="mr-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {options.map(([value, label]) => (
        <Link className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${active === value ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"}`} href={href(value)} key={value}>
          {label}
        </Link>
      ))}
    </div>
  );
}
