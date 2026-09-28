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

function NewsLink({ item, duplicate = false, compact = false }: { item: ArenaNewsItem; duplicate?: boolean; compact?: boolean }) {
  const Icon = item.kind === "TOURNAMENT" ? Trophy : Swords;
  if (compact) return <Link aria-hidden={duplicate || undefined} className="flex shrink-0 items-center gap-2 px-3 text-sm font-semibold text-foreground/90 transition hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href={item.href} tabIndex={duplicate ? -1 : undefined}><Icon className={item.kind === "TOURNAMENT" ? "size-3.5 text-amber-300" : "size-3.5 text-primary"} /><span className="whitespace-nowrap">{item.headline}</span><span className="text-xs font-medium text-muted-foreground">· {formatRelativeTime(item.occurredAt)}</span></Link>;
  return <Link aria-hidden={duplicate || undefined} className="flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-background/45 px-3 py-2.5 transition hover:border-primary/35 hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-ring" href={item.href} tabIndex={duplicate ? -1 : undefined}><span className={item.kind === "TOURNAMENT" ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300" : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"}><Icon className="size-4" /></span><span className="min-w-0"><span className="block whitespace-nowrap text-sm font-bold">{item.headline}</span><span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">{item.detail}<span className="size-1 rounded-full bg-muted-foreground/50" />{formatRelativeTime(item.occurredAt)}</span></span></Link>;
}

export function ArenaNewsMarquee({ items, compact = false, fixed = false }: { items: ArenaNewsItem[]; compact?: boolean; fixed?: boolean }) {
  if (items.length === 0) return null;
  if (compact) return <section aria-label="Điểm tin Arena" className={fixed ? "arena-news-marquee-fixed" : "overflow-hidden border-y border-white/8 bg-card"}><div className="flex h-10 items-center"><div className="flex shrink-0 items-center gap-2 border-r border-white/8 px-4 text-[0.68rem] font-black uppercase tracking-[0.14em] text-primary"><Radio className="size-3.5" /> Điểm tin</div><div className="relative min-w-0 flex-1 overflow-hidden before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-5 before:bg-gradient-to-r before:from-card before:to-transparent after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-5 after:bg-gradient-to-l after:from-card after:to-transparent"><div className="arena-news-marquee-track flex h-10 w-max items-center gap-5">{items.map((item) => <NewsLink compact item={item} key={item.id} />)}{items.map((item) => <NewsLink compact duplicate item={item} key={`${item.id}-duplicate`} />)}</div></div></div></section>;
  return <section aria-label="Điểm tin Arena" className="arena-news-marquee overflow-hidden border-y border-white/8 bg-card/70"><div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-primary"><Radio className="size-3.5" /> Điểm tin Arena</div><div className="relative overflow-hidden px-3 py-3 before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-8 before:bg-gradient-to-r before:from-card before:to-transparent after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-8 after:bg-gradient-to-l after:from-card after:to-transparent"><div className="arena-news-marquee-track flex w-max items-center gap-3">{items.map((item) => <NewsLink item={item} key={item.id} />)}{items.map((item) => <NewsLink duplicate item={item} key={`${item.id}-duplicate`} />)}</div></div></section>;
}
