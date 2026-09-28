import Link from "next/link";
import { Radio, Swords, Trophy } from "lucide-react";

import type { ArenaNewsItem } from "@/services/arena-news";

function formatRelativeTime(value: Date) {
  const elapsed = Date.now() - value.getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function NewsLink({ item, duplicate = false }: { item: ArenaNewsItem; duplicate?: boolean }) {
  const Icon = item.kind === "TOURNAMENT" ? Trophy : Swords;
  return <Link aria-hidden={duplicate || undefined} className="flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-background/45 px-3 py-2.5 transition hover:border-primary/35 hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-ring" href={item.href} tabIndex={duplicate ? -1 : undefined}><span className={item.kind === "TOURNAMENT" ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300" : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"}><Icon className="size-4" /></span><span className="min-w-0"><span className="block whitespace-nowrap text-sm font-bold">{item.headline}</span><span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">{item.detail}<span className="size-1 rounded-full bg-muted-foreground/50" />{formatRelativeTime(item.occurredAt)}</span></span></Link>;
}

export function ArenaNewsMarquee({ items }: { items: ArenaNewsItem[] }) {
  if (items.length === 0) return null;
  return <section aria-label="Điểm tin Arena" className="overflow-hidden rounded-2xl border border-white/8 bg-card/70"><div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-primary"><Radio className="size-3.5" /> Điểm tin Arena</div><div className="relative overflow-hidden px-3 py-3 before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-8 before:bg-gradient-to-r before:from-card before:to-transparent after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-8 after:bg-gradient-to-l after:from-card after:to-transparent"><div className="arena-news-marquee-track flex w-max items-center gap-3">{items.map((item) => <NewsLink item={item} key={item.id} />)}{items.map((item) => <NewsLink duplicate item={item} key={`${item.id}-duplicate`} />)}</div></div></section>;
}
