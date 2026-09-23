import Link from "next/link";
import { BarChart3, Swords, UsersRound } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getStatisticsSnapshot } from "@/services/statistics.service";

export const dynamic = "force-dynamic";

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ player?: string }> }) {
  const databaseReady = isDatabaseConfigured();
  const stats = databaseReady ? await getStatisticsSnapshot() : null;
  const params = await searchParams;
  const selectedPlayer = stats?.players.find((player) => player.playerId === params.player) ?? stats?.players[0];
  const rivalries = selectedPlayer ? stats?.rivalriesByPlayer.get(selectedPlayer.playerId) ?? [] : [];

  return <div className="mx-auto max-w-6xl space-y-7">
    <PageHeading eyebrow="Thống kê" title="Phong độ & đối đầu" description="Không còn cãi bằng trí nhớ: mọi con số đều lấy từ trận xếp hạng đã lưu." />
    {!databaseReady ? <DatabaseSetupNotice /> : null}
    {stats && stats.players.length === 0 ? <EmptyStats /> : null}
    {stats && stats.players.length > 0 ? <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.players.slice(0, 4).map((player) => <Link href={`/statistics?player=${player.playerId}`} key={player.playerId}><Card className={selectedPlayer?.playerId === player.playerId ? "border-primary/40 bg-primary/8" : "border-white/10 bg-card/80"}><CardContent className="p-4"><p className="font-black">{player.playerName}</p><p className="mt-1 text-sm text-muted-foreground">{player.wins}W · {player.losses}L · {player.goalsFor} GF</p></CardContent></Card></Link>)}
      </section>
      {selectedPlayer ? <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><Card className="border-primary/25 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /> Hồ sơ {selectedPlayer.playerName}</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3 text-center"><Stat label="Trận" value={selectedPlayer.matches} /><Stat label="Thắng" value={selectedPlayer.wins} /><Stat label="Hòa" value={selectedPlayer.draws} /><Stat label="Thua" value={selectedPlayer.losses} /><Stat label="GF" value={selectedPlayer.goalsFor} /><Stat label="GA" value={selectedPlayer.goalsAgainst} /></CardContent></Card><Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Swords className="size-5 text-primary" /> Đối đầu</CardTitle></CardHeader><CardContent className="space-y-3">{rivalries.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có đối thủ để tổng kết.</p> : rivalries.slice(0, 5).map((rival) => <div className="flex items-center justify-between" key={rival.playerId}><span className="font-bold">{rival.playerName}</span><Badge variant="outline">{rival.wins}W · {rival.draws}D · {rival.losses}L</Badge></div>)}</CardContent></Card></section> : null}
      <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="size-5 text-primary" /> Cặp đôi 2v2</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stats.pairs.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu 2v2.</p> : stats.pairs.slice(0, 9).map((pair) => <div className="rounded-xl border border-white/10 bg-background/40 p-4" key={pair.key}><p className="font-black">{pair.playerNames}</p><p className="mt-1 text-sm text-muted-foreground">{pair.matches} trận · {pair.wins} thắng · {pair.winRate}% winrate</p></div>)}</CardContent></Card>
    </> : null}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-background/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
function EmptyStats() { return <Card className="border-dashed border-white/12 bg-transparent"><CardContent className="flex flex-col items-center py-16 text-center"><BarChart3 className="mb-4 size-10 text-muted-foreground" /><h2 className="font-bold">Đá trận xếp hạng đầu tiên để mở thống kê.</h2></CardContent></Card>; }
