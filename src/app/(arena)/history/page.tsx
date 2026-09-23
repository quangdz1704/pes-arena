import type { Metadata } from "next";
import Link from "next/link";
import { History, Plus } from "lucide-react";

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

  return <div className="mx-auto max-w-4xl space-y-7"><PageHeading eyebrow="Thống kê" title="Lịch sử" description="Các trận đã hoàn tất, lưu trực tiếp từ sân PES vào PostgreSQL." action={<Button asChild className="rounded-xl font-bold"><Link href="/matches/new"><Plus className="size-4" /> Trận mới</Link></Button>} />{!databaseReady ? <DatabaseSetupNotice /> : history.length === 0 ? <Card className="border-dashed bg-transparent"><CardContent className="flex flex-col items-center py-16 text-center"><History className="mb-4 size-10 text-muted-foreground" /><h2 className="font-bold">Chưa có trận nào được lưu.</h2><p className="mt-1 text-sm text-muted-foreground">Đá trận đầu tiên để bắt đầu lịch sử đau thương.</p><Button asChild className="mt-5"><Link href="/matches/new">Tạo trận đầu tiên</Link></Button></CardContent></Card> : <div className="space-y-3">{history.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="block"><Card className="border-white/10 bg-card/80 transition hover:border-primary/40 hover:bg-card"><CardContent className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-5 text-center"><div><p className="font-bold">{match.sides[0].players.map((player) => player.name).join(" + ")}</p><p className="mt-1 text-xs text-muted-foreground">{match.sides[0].team?.name}</p></div><div><p className="text-3xl font-black tabular-nums">{match.sides[0].score} <span className="text-muted-foreground">-</span> {match.sides[1].score}</p><div className="mt-2 flex justify-center gap-1"><Badge variant="outline">{match.matchMode === "ONE_V_ONE" ? "1v1" : "2v2"}</Badge>{!match.isRanked ? <Badge variant="secondary">Không xếp hạng</Badge> : null}</div></div><div><p className="font-bold">{match.sides[1].players.map((player) => player.name).join(" + ")}</p><p className="mt-1 text-xs text-muted-foreground">{match.sides[1].team?.name}</p></div><p className="col-span-3 text-xs text-muted-foreground">{formatPlayedAt(match.playedAt)}</p></CardContent></Card></Link>)}</div>}</div>;
}
