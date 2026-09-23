import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";

export function ComingSoon({
  eyebrow,
  title,
  description,
  phase,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-8">
      <PageHeading eyebrow={eyebrow} title={title} description={description} />
      <Card className="border-dashed bg-transparent">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-8" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Phase {phase}
          </p>
          <h2 className="mt-2 text-xl font-black">Nền móng đã sẵn sàng</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Tính năng này sẽ được mở đúng thứ tự sau khi phase hiện tại vượt qua
            toàn bộ quality gate.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/"><ArrowLeft className="size-4" /> Về Tổng quan</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
