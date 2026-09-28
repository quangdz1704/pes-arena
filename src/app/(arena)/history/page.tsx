import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, History, Plus, Swords, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { listMatchHistory } from "@/services/match.service";

export const metadata: Metadata = { title: "Lịch sử" };
export const dynamic = "force-dynamic";

function formatPlayedAt(playedAt: string | null) {
  if (!playedAt) return "Vừa xong";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(playedAt));
}

export default async function HistoryPage() {
  const databaseReady = isDatabaseConfigured();
  const history = databaseReady ? await listMatchHistory() : [];

  return <div className="mx-auto max-w-4xl space-y-7"><PageHeading eyebrow="Thống kê" title="Lịch sử" description="Các trận đã hoàn tất, lưu trực tiếp từ sân PES vào PostgreSQL." action={<Button asChild className="rounded-xl font-bold"><Link href="/matches/new"><Plus className="size-4" /> Trận mới</Link></Button>} />{!databaseReady ? <DatabaseSetupNotice /> : history.length === 0 ? <Card className="border-dashed bg-transparent"><CardContent className="flex flex-col items-center py-16 text-center"><History className="mb-4 size-10 text-muted-foreground" /><h2 className="font-bold">Chưa có trận nào được lưu.</h2><p className="mt-1 text-sm text-muted-foreground">Đá trận đầu tiên để bắt đầu lịch sử đau thương.</p><Button asChild className="mt-5"><Link href="/matches/new">Tạo trận đầu tiên</Link></Button></CardContent></Card> : <div className="space-y-3">{history.map((match) => <Card key={match.id} className="border-white/10 bg-card/80 transition hover:border-primary/40 hover:bg-card"><CardContent className="py-4 sm:py-5"><Link href={`/matches/${match.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl text-center outline-none transition hover:bg-white/[0.025] focus-visible:ring-2 focus-visible:ring-ring sm:gap-3"><div className="min-w-0 py-1"><p className="truncate font-bold">{match.sides[0].players.map((player) => player.name).join(" + ")}</p><p className="mt-1 truncate text-xs text-muted-foreground">{match.sides[0].team?.name}</p></div><div><p className="whitespace-nowrap text-2xl font-black tabular-nums sm:text-3xl">{match.sides[0].score} <span className="text-muted-foreground">-</span> {match.sides[1].score}</p><span className="mt-1 inline-flex items-center text-xs font-semibold text-muted-foreground transition group-hover:text-primary">Xem chi tiết <ChevronRight className="size-3" /></span></div><div className="min-w-0 py-1"><p className="truncate font-bold">{match.sides[1].players.map((player) => player.name).join(" + ")}</p><p className="mt-1 truncate text-xs text-muted-foreground">{match.sides[1].team?.name}</p></div></Link><div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-border/70 pt-3 text-xs"><Badge variant="outline">{match.matchMode === "ONE_V_ONE" ? "1v1" : "2v2"}</Badge>{match.tournament ? <Link href={`/tournaments/${match.tournament.id}`} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"><Badge className="cursor-pointer gap-1 border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/15" variant="outline"><Trophy className="size-3" /> Đấu giải · {match.tournament.name}</Badge></Link> : <Badge className="gap-1" variant="secondary"><Swords className="size-3" /> Giao hữu</Badge>}<Badge variant="secondary">{match.tournament ? "Không tính BXH giao hữu" : match.isRanked ? "Tính Điểm Arena" : "Không xếp hạng"}</Badge><span className="basis-full text-muted-foreground sm:basis-auto sm:pl-1">{formatPlayedAt(match.playedAt)}</span></div></CardContent></Card>)}</div>}</div>;
}
