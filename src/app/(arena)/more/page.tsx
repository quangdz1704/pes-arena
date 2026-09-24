import Link from "next/link";
import { BarChart3, Settings, Shield, Swords, Trophy, UserRound, type LucideIcon } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";

const shortcuts: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: "/tournaments", label: "Giải đấu", description: "League, knockout và lịch thi đấu.", icon: Trophy },
  { href: "/players", label: "Người chơi", description: "Quản lý tuyển thủ trong arena.", icon: UserRound },
  { href: "/teams", label: "Đội bóng", description: "Kho đội cùng rating và tier.", icon: Shield },
  { href: "/leaderboard", label: "Bảng xếp hạng", description: "Xem ai đang đứng trên đỉnh.", icon: BarChart3 },
  { href: "/records", label: "Kỷ lục", description: "Những con số đáng nhớ nhất.", icon: Swords },
  { href: "/settings", label: "Cài đặt", description: "Cấu hình arena và Discord.", icon: Settings },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeading eyebrow="PES Arena" title="Thêm" description="Các khu vực quản lý và thống kê khác của arena." />
      <section className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map(({ href, label, description, icon: Icon }) => (
          <Link className="block" href={href} key={href}>
            <Card className="h-full border-white/10 bg-card/80 transition hover:border-primary/50 hover:bg-card">
              <CardContent className="flex min-h-28 items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <div className="min-w-0"><p className="font-black">{label}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
