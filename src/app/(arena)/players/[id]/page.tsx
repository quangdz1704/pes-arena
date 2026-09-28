import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Medal, ShieldCheck, Swords, Trophy } from "lucide-react";

import { PlayerRadar } from "@/components/shared/player-radar";
import { ArenaRankMark } from "@/components/shared/arena-rank-mark";
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
  const { player, stats, honors, rating, rank, isProvisional, ratedMatches, rivalries } = profile;

  return <div className="mx-auto max-w-6xl space-y-7">
    <Button asChild className="-mb-3" variant="ghost"><Link href="/players"><ArrowLeft className="size-4" /> Quay lại người chơi</Link></Button>
    <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
      <Card className="border-primary/25 bg-card/80"><CardContent className="flex flex-col items-center p-7 text-center sm:flex-row sm:text-left">
        <Avatar className="size-24 border-2 border-primary/30"><AvatarImage alt={player.name} src={player.avatarUrl ?? undefined} /><AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">{initials(player.name)}</AvatarFallback></Avatar>
        <div className="mt-4 min-w-0 sm:ml-5 sm:mt-0"><div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><h1 className="text-3xl font-black">{player.name}</h1><Badge variant={player.isActive ? "default" : "secondary"}>{player.isActive ? "Đang chơi" : "Tạm nghỉ"}</Badge><Badge variant="outline">{isProvisional ? `Tân binh · ${ratedMatches}/5 trận` : `Hạng #${rank}`}</Badge></div><p className="mt-2 text-muted-foreground">{player.nickname || "Chưa có biệt danh"}</p><p className="mt-4 text-sm text-muted-foreground">{stats.matches > 0 ? `${stats.matches} trận tự tạo xếp hạng đã hoàn tất.` : "Chưa có trận tự tạo để thống kê."}</p></div>
      </CardContent></Card>
      <Card className="border-white/10 bg-card/80"><CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"><Stat label={<span className="inline-flex items-center gap-1"><ArenaRankMark className="size-3.5" /> Điểm Arena</span>} value={rating.toLocaleString("vi-VN")} tone="text-primary" /><Stat label="Trận" value={stats.matches} /><Stat label="Winrate" value={`${stats.winRate}%`} /><Stat label="Chuỗi thắng" value={`${stats.currentStreak}W`} /></CardContent></Card>
    </section>

    <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Swords className="size-5 text-primary" /> Đối đầu trực tiếp</CardTitle><p className="text-sm font-normal text-muted-foreground">Được ưu tiên khi Điểm Arena bằng nhau và đã gặp tối thiểu 2 trận.</p></CardHeader><CardContent>{rivalries.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu đối đầu.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rivalries.slice(0, 6).map((rival) => <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/40 p-4" key={rival.playerId}><div><p className="font-black">vs {rival.playerName}</p><p className="mt-1 text-xs text-muted-foreground">{rival.matches} lần chạm trán</p></div><Badge variant="outline">{rival.wins}W · {rival.draws}D · {rival.losses}L</Badge></div>)}</div>}</CardContent></Card>

    <Card className="border-amber-300/20 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-amber-300" /> Danh hiệu giải</CardTitle></CardHeader><CardContent>{honors.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có danh hiệu từ giải đấu. Vào giải và mang cúp về đây.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{honors.map((honor) => <Link className="rounded-xl border border-white/10 bg-background/40 p-4 transition hover:border-amber-300/40" href={`/tournaments/${honor.tournamentId}`} key={`${honor.tournamentId}-${honor.place}`}><div className="flex items-center gap-3"><HonorIcon place={honor.place} /><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{honor.place === 1 ? "Vô địch" : honor.place === 2 ? "Á quân" : "Hạng ba"}</p><p className="mt-1 truncate font-black">{honor.tournamentName}</p><p className="mt-1 text-xs text-muted-foreground">{honor.tournamentType === "KNOCKOUT" ? "Knockout" : "League"}</p></div></div></Link>)}</div>}</CardContent></Card>

    <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="border-primary/25 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-primary" /> Radar phong độ</CardTitle><p className="text-sm font-normal text-muted-foreground">Mốc 100 là chỉ số tốt nhất trong từng trục.</p></CardHeader><CardContent><PlayerRadar metrics={stats.radar} /></CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><Swords className="size-5 text-primary" /> Hiệu suất ghi bàn</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3"><Stat label="GF" value={stats.goalsFor} /><Stat label="GA" value={stats.goalsAgainst} /><Stat label="Hiệu số" value={`${stats.goalsFor - stats.goalsAgainst >= 0 ? "+" : ""}${stats.goalsFor - stats.goalsAgainst}`} /><Stat label="Trận sạch lưới" value={stats.cleanSheets} /></CardContent></Card>
        <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Thành tích</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3"><Stat label="Thắng" value={stats.wins} tone="text-primary" /><Stat label="Hòa" value={stats.draws} /><Stat label="Thua" value={stats.losses} tone="text-rose-400" /></CardContent></Card>
      </div>
    </section>
  </div>;
}

function Stat({ label, value, tone }: { label: ReactNode; value: string | number; tone?: string }) {
  return <div className="rounded-xl bg-background/50 p-3 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-black ${tone ?? ""}`}>{value}</p></div>;
}

function HonorIcon({ place }: { place: 1 | 2 | 3 }) {
  const className = place === 1 ? "text-amber-300" : place === 2 ? "text-slate-300" : "text-amber-700";
  return place === 1 ? <Trophy className={`size-7 ${className}`} /> : <Medal className={`size-7 ${className}`} />;
}
