import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Swords, Trophy } from "lucide-react";

import { PlayerRadar } from "@/components/shared/player-radar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getPlayerProfile } from "@/services/player.service";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();
  const { player, stats } = profile;

  return <div className="mx-auto max-w-6xl space-y-7">
    <Button asChild className="-mb-3" variant="ghost"><Link href="/players"><ArrowLeft className="size-4" /> Quay lại người chơi</Link></Button>
    <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
      <Card className="border-primary/25 bg-card/80"><CardContent className="flex flex-col items-center p-7 text-center sm:flex-row sm:text-left">
        <Avatar className="size-24 border-2 border-primary/30"><AvatarImage alt={player.name} src={player.avatarUrl ?? undefined} /><AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">{initials(player.name)}</AvatarFallback></Avatar>
        <div className="mt-4 min-w-0 sm:ml-5 sm:mt-0"><div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><h1 className="text-3xl font-black">{player.name}</h1><Badge variant={player.isActive ? "default" : "secondary"}>{player.isActive ? "Đang chơi" : "Tạm nghỉ"}</Badge></div><p className="mt-2 text-muted-foreground">{player.nickname || "Chưa có biệt danh"}</p><p className="mt-4 text-sm text-muted-foreground">{stats.matches > 0 ? `${stats.matches} trận xếp hạng đã hoàn tất.` : "Chưa có trận xếp hạng để thống kê."}</p></div>
      </CardContent></Card>
      <Card className="border-white/10 bg-card/80"><CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"><Stat label="Trận" value={stats.matches} /><Stat label="Thắng" value={stats.wins} tone="text-primary" /><Stat label="Winrate" value={`${stats.winRate}%`} /><Stat label="Chuỗi thắng" value={`${stats.currentStreak}W`} /></CardContent></Card>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="border-primary/25 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-primary" /> Radar phong độ</CardTitle><p className="text-sm font-normal text-muted-foreground">Mốc 100 là chỉ số tốt nhất trong từng trục.</p></CardHeader><CardContent><PlayerRadar metrics={stats.radar} /></CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Swords className="size-5 text-primary" /> Hiệu suất ghi bàn</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3"><Stat label="GF" value={stats.goalsFor} /><Stat label="GA" value={stats.goalsAgainst} /><Stat label="Hiệu số" value={`${stats.goalsFor - stats.goalsAgainst >= 0 ? "+" : ""}${stats.goalsFor - stats.goalsAgainst}`} /><Stat label="Trận sạch lưới" value={stats.cleanSheets} /></CardContent></Card>
        <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Thành tích</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3"><Stat label="Thắng" value={stats.wins} tone="text-primary" /><Stat label="Hòa" value={stats.draws} /><Stat label="Thua" value={stats.losses} tone="text-rose-400" /></CardContent></Card>
      </div>
    </section>
  </div>;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return <div className="rounded-xl bg-background/50 p-3 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-black ${tone ?? ""}`}>{value}</p></div>;
}
