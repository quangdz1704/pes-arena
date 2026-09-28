import { Shield } from "lucide-react";

import { cn } from "cn";

export function ArenaRankMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-md bg-primary/12 text-primary",
        className,
      )}
    >
      <Shield aria-hidden className="size-3.5 fill-current/20" />
      <span className="sr-only">Điểm Arena</span>
    </span>
  );
}
