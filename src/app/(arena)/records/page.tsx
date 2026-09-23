import { Crown, Flame, Goal, ShieldAlert, UsersRound } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getLeaderboard } from "@/services/leaderboard.service";
import { getStatisticsSnapshot } from "@/services/statistics.service";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const databaseReady = isDatabaseConfigured();
  const [leaderboard, stats] = databaseReady
    ? await Promise.all([
        getLeaderboard({ period: "ALL", matchMode: "ALL", sort: "WINS" }),
        getStatisticsSnapshot(),
      ])
    : [[], null];

  const mostGoals = [...leaderboard].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const mostConceded = [...leaderboard].sort((a, b) => b.goalsAgainst - a.goalsAgainst)[0];
  const bestStreak = [...leaderboard].sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const bestPair = stats?.pairs[0];

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeading eyebrow="Thống kê" title="Kỷ lục" description="Những cột mốc để gáy, và cả bằng chứng không thể chối khi bị bóc phốt." />
      {!databaseReady ? <DatabaseSetupNotice /> : null}
      {databaseReady && leaderboard.length === 0 ? <EmptyRecords /> : null}
      {databaseReady && leaderboard.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RecordCard icon={Crown} label="Vua chiến thắng" name={leaderboard[0]?.playerName ?? "—"} value={`${leaderboard[0]?.wins ?? 0} trận thắng`} highlight />
          <RecordCard icon={Goal} label="Máy ghi bàn" name={mostGoals?.playerName ?? "—"} value={`${mostGoals?.goalsFor ?? 0} bàn thắng`} />
          <RecordCard icon={ShieldAlert} label="Thủng lưới nhiều nhất" name={mostConceded?.playerName ?? "—"} value={`${mostConceded?.goalsAgainst ?? 0} bàn thua`} />
          <RecordCard icon={Flame} label="Chuỗi thắng đang chạy" name={bestStreak?.playerName ?? "—"} value={`${bestStreak?.currentStreak ?? 0} trận liên tiếp`} />
          <RecordCard icon={UsersRound} label="Cặp 2v2 hiệu quả nhất" name={bestPair?.playerNames ?? "Chưa có"} value={bestPair ? `${bestPair.wins} thắng · ${bestPair.winRate}% winrate` : "Cần thêm trận 2v2"} />
        </div>
      ) : null}
    </div>
  );
}

function RecordCard({ icon: Icon, label, name, value, highlight = false }: { icon: typeof Crown; label: string; name: string; value: string; highlight?: boolean }) {
  return <Card className={highlight ? "border-primary/40 bg-primary/8" : "border-white/10 bg-card/80"}><CardContent className="p-5"><Icon className={highlight ? "size-7 text-primary" : "size-7 text-amber-300"} /><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{name}</p><p className="mt-1 text-sm text-muted-foreground">{value}</p></CardContent></Card>;
}

function EmptyRecords() { return <Card className="border-dashed border-white/12 bg-transparent"><CardContent className="flex flex-col items-center py-16 text-center"><Crown className="mb-4 size-10 text-muted-foreground" /><h2 className="font-bold">Chưa có kỷ lục nào để ghi nhận.</h2><p className="mt-1 text-sm text-muted-foreground">Đá thêm trận xếp hạng để mở đại sảnh danh vọng.</p></CardContent></Card>; }
