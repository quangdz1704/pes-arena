"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Swords, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TournamentCarouselItem = {
  id: string;
  name: string;
  type: "LEAGUE" | "KNOCKOUT";
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELLED";
  competitors: number;
  fixtures: number;
  createdAt: string;
};

const statusLabel = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang diễn ra",
  FINISHED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
} satisfies Record<TournamentCarouselItem["status"], string>;

export function TournamentCarousel({ items }: { items: TournamentCarouselItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = items[currentIndex];
  if (!current) return null;

  const move = (direction: -1 | 1) => {
    setCurrentIndex((index) => (index + direction + items.length) % items.length);
  };
  const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(current.createdAt));
  const isActive = current.status === "ACTIVE";

  return (
    <Card className="overflow-hidden border-white/10 bg-card/80">
      <CardContent className="p-0">
        <div className="grid min-h-56 sm:grid-cols-[1.1fr_.9fr]">
          <div className="relative overflow-hidden p-5 sm:p-7">
            <div aria-hidden className={isActive ? "absolute -left-12 -top-16 size-56 rounded-full bg-primary/15 blur-3xl" : "absolute -left-12 -top-16 size-56 rounded-full bg-amber-300/10 blur-3xl"} />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isActive ? "default" : "outline"} className={isActive ? "" : "border-white/15 bg-background/35"}>{statusLabel[current.status]}</Badge>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{current.type === "KNOCKOUT" ? "Knockout" : "League"} · {current.matchMode === "ONE_V_ONE" ? "1v1" : "2v2"}</span>
              </div>
              <div className="mt-5 flex items-start gap-4">
                <div className={isActive ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary" : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"}><Trophy className="size-6" /></div>
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{isActive ? "Cuộc chiến đang mở" : current.status === "FINISHED" ? "Đã khép lại" : "Lịch sử giải"}</p><h3 className="mt-1 truncate text-2xl font-black sm:text-3xl">{current.name}</h3><p className="mt-2 text-sm text-muted-foreground">Tạo ngày {date}</p></div>
              </div>
              <Button asChild className="mt-6 rounded-xl font-black" variant={isActive ? "default" : "outline"}><Link href={`/tournaments/${current.id}`}>{isActive ? "Tiếp tục giải" : "Xem chi tiết"}</Link></Button>
            </div>
          </div>
          <div className="border-t border-white/10 bg-background/35 p-5 sm:border-l sm:border-t-0 sm:p-7">
            <div className="grid grid-cols-2 gap-3"><CarouselStat label="Đối thủ" value={current.competitors} /><CarouselStat label="Trận" value={current.fixtures} /></div>
            <div className="mt-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><Swords className="size-4 text-primary" /> Giải {currentIndex + 1}/{items.length}</div><div className="flex gap-2"><Button aria-label="Giải trước" disabled={items.length === 1} onClick={() => move(-1)} size="icon-sm" variant="outline"><ChevronLeft className="size-4" /></Button><Button aria-label="Giải tiếp theo" disabled={items.length === 1} onClick={() => move(1)} size="icon-sm" variant="outline"><ChevronRight className="size-4" /></Button></div></div>
            <div className="mt-4 flex gap-1.5">{items.map((item, index) => <button aria-label={`Xem giải ${item.name}`} className={index === currentIndex ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-white/15 transition hover:bg-white/30"} key={item.id} onClick={() => setCurrentIndex(index)} type="button" />)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CarouselStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 bg-card/70 p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-primary">{value}</p></div>;
}
