import { ArrowDownRight, ArrowUpRight, Minus, ShieldCheck } from "lucide-react";

import { cn } from "cn";

export function ArenaRankMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center text-primary",
        className,
      )}
    >
      <ShieldCheck className="size-full stroke-[1.8]" />
    </span>
  );
}

export function ArenaRatingMovement({
  delta,
  className,
}: {
  delta: number;
  className?: string;
}) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const tone =
    delta > 0
      ? "bg-primary/10 text-primary"
      : delta < 0
        ? "bg-rose-400/10 text-rose-400"
        : "bg-muted text-muted-foreground";
  const label =
    delta > 0
      ? `Tăng ${delta} điểm`
      : delta < 0
        ? `Giảm ${Math.abs(delta)} điểm`
        : "Không đổi";

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full px-2 text-xs font-black tabular-nums",
        tone,
        className,
      )}
      title={label}
    >
      <Icon aria-hidden className="size-3.5" />
      {Math.abs(delta)}
    </span>
  );
}
