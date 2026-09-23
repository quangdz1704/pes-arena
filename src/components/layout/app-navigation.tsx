"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock3,
  Gamepad2,
  History,
  House,
  Medal,
  Menu,
  Settings,
  Shield,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopSections = [
  {
    label: null,
    items: [{ href: "/", label: "Tổng quan", icon: House }],
  },
  {
    label: "Thi đấu",
    items: [
      { href: "/matches/new", label: "Trận mới", icon: Gamepad2, featured: true },
      { href: "/tournaments", label: "Giải đấu", icon: Trophy },
    ],
  },
  {
    label: "Thống kê",
    items: [
      { href: "/leaderboard", label: "Bảng xếp hạng", icon: Medal },
      { href: "/history", label: "Lịch sử", icon: History },
      { href: "/statistics", label: "Thống kê", icon: BarChart3 },
      { href: "/records", label: "Kỷ lục", icon: Swords },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/players", label: "Người chơi", icon: UserRound },
      { href: "/teams", label: "Đội bóng", icon: Shield },
      { href: "/settings", label: "Cài đặt", icon: Settings },
    ],
  },
] as const;

const mobileItems = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/history", label: "Lịch sử", icon: Clock3 },
  { href: "/matches/new", label: "Trận mới", icon: Gamepad2, featured: true },
  { href: "/leaderboard", label: "BXH", icon: Medal },
  { href: "/more", label: "Thêm", icon: Menu },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/8 bg-sidebar/95 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(106,255,148,0.18)]">
          <Gamepad2 className="size-6" />
        </span>
        <span>
          <span className="block text-lg font-black tracking-[0.12em]">PES ARENA</span>
          <span className="block text-xs text-muted-foreground">Đá đi rồi nói chuyện.</span>
        </span>
      </Link>

      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {desktopSections.map((section, sectionIndex) => (
          <div key={section.label ?? sectionIndex} className="space-y-1">
            {section.label ? (
              <p className="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {section.label}
              </p>
            ) : null}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground",
                    active && "bg-white/8 text-foreground",
                    "featured" in item && item.featured &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  <Icon className="size-[1.1rem]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-50 grid h-[4.75rem] grid-cols-5 border-t border-white/10 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        const featured = "featured" in item && item.featured;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold text-muted-foreground",
              active && "text-primary",
              featured && "text-primary",
            )}
          >
            <span
              className={cn(
                "grid size-7 place-items-center",
                featured &&
                  "absolute -top-5 size-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(106,255,148,0.28)]",
              )}
            >
              <Icon className={cn("size-5", featured && "size-7")} />
            </span>
            <span className={cn(featured && "pt-8")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-background/85 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/" className="flex items-center gap-2 font-black tracking-[0.1em]">
        <Gamepad2 className="size-5 text-primary" /> PES ARENA
      </Link>
      <Button asChild size="sm" className="rounded-xl font-bold">
        <Link href="/matches/new">Trận mới</Link>
      </Button>
    </header>
  );
}
