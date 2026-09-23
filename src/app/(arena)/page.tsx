import Link from "next/link";
import { Gamepad2, Play, Shield, Sparkles, Trophy, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getFoundationSummary } from "@/repositories/dashboard.repository";
import { getActiveMatch } from "@/services/match.service";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const databaseReady = isDatabaseConfigured();
  const [summary, activeMatch] = databaseReady
    ? await Promise.all([getFoundationSummary(), getActiveMatch()])
    : [{ players: 0, teams: 0, pools: 0 }, null];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-6 py-8 sm:px-9 sm:py-10">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="size-3.5" /> Tối nay đá PES
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Random công bằng. <span className="text-primary">Gáy có dữ liệu.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Chọn người, quay đội, nhập tỷ số. PES Arena sẽ lo phần lịch sử,
            BXH và drama còn lại.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-black">
              <Link href="/matches/new">
                <Gamepad2 className="size-5" /> {activeMatch ? "Tiếp tục trận" : "Tạo trận mới"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl">
              <Link href="/players">Quản lý người chơi</Link>
            </Button>
          </div>
        </div>
      </section>

      {!databaseReady ? (
        <Card className="border-amber-400/20 bg-amber-400/5">
          <CardContent className="flex gap-3 py-5 text-sm text-amber-100">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-300" />
            Chưa kết nối PostgreSQL. Sao chép `.env.example` thành `.env.local`,
            thêm `DATABASE_URL`, sau đó chạy migration và seed.
          </CardContent>
        </Card>
      ) : null}

      {activeMatch ? (
        <section className="relative overflow-hidden rounded-3xl border border-primary/35 bg-primary/8 p-1 shadow-[0_0_36px_rgba(106,255,148,0.1)]">
          <div className="rounded-[1.35rem] bg-card/90 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="relative flex size-2"><span className="absolute inline-flex size-2 animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span>
                  <p className="text-xs font-black tracking-[0.2em]">TRẬN ĐANG DIỄN RA</p>
                </div>
                <h2 className="mt-3 text-xl font-black sm:text-2xl">{activeMatch.matchMode === "TWO_V_TWO" ? "Kèo 2v2 đang chờ kết quả" : "Kèo 1v1 đang chờ kết quả"}</h2>
              </div>
              <Badge className="rounded-full px-3 py-1">{activeMatch.matchMode === "ONE_V_ONE" ? "1v1" : "2v2"}</Badge>
            </div>
            <div className="mt-5 grid gap-3 text-center sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              {[activeMatch.sides[0], activeMatch.sides[1]].map((side, index) => (
                <div key={side.id} className={index === 1 ? "contents" : undefined}>
                  {index === 1 ? <p className="hidden text-lg font-black text-primary sm:block">VS</p> : null}
                  <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                    <p className="font-black">{side.players.map((player) => player.name).join(" + ")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{side.team?.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild size="lg" className="mt-5 h-12 w-full rounded-xl font-black sm:w-auto">
              <Link href={`/matches/${activeMatch.id}`}><Play className="size-5" /> Tiếp tục & nhập tỉ số</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Nền tảng
            </p>
            <h2 className="mt-1 text-2xl font-bold">Sân đấu đã sẵn sàng</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Người chơi hoạt động", value: summary.players, icon: UserRound },
            { label: "Đội bóng sẵn sàng", value: summary.teams, icon: Shield },
            { label: "Nhóm đội", value: summary.pools, icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="border-white/8 bg-card/80">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </CardTitle>
                  <Icon className="size-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black tabular-nums">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="border-dashed border-white/12 bg-transparent">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Trophy className="mb-4 size-9 text-muted-foreground" />
          <h2 className="text-lg font-bold">Chưa có trận nào đang diễn ra.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bắt đầu một kèo mới, sau đó bạn luôn có thể quay lại đây để nhập tỉ số.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
