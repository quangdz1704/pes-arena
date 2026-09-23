"use client";

import { useActionState, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";

import { sendLeaderboardAction } from "./actions";

export function DiscordLeaderboardForm() {
  const [period, setPeriod] = useState("SEVEN_DAYS");
  const [state, action, pending] = useActionState(sendLeaderboardAction, initialActionState);
  useEffect(() => { if (state.message) (state.status === "success" ? toast.success : toast.error)(state.message); }, [state]);
  return <form action={action} className="flex flex-wrap items-center gap-3"><select aria-label="Khoảng thời gian BXH" className="h-10 rounded-md border border-white/10 bg-background px-3 text-sm" name="period" onChange={(event) => setPeriod(event.target.value)} value={period}><option value="SEVEN_DAYS">7 ngày gần nhất</option><option value="THIRTY_DAYS">30 ngày gần nhất</option><option value="ALL">Toàn thời gian</option></select><Button disabled={pending} type="submit"><Send className="size-4" />{pending ? "Đang gửi..." : "Gửi BXH Discord"}</Button></form>;
}
