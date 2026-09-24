"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, Minus, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import type { MatchDetailDto, MatchSideDto } from "@/repositories/match.repository";

import { saveMatchScoreAction, updateMatchScoreAction } from "../actions";

function SideIdentity({ side }: { side: MatchSideDto }) {
  return (
    <div className="space-y-1 text-center">
      <p className="text-lg font-black">{side.players.map((player) => player.name).join(" + ")}</p>
      <p className="text-sm text-muted-foreground">{side.team?.name ?? "Chưa chọn đội"}</p>
      {side.team ? <Badge variant="outline">Tier {side.team.tier} · {side.team.rating}</Badge> : null}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending} className="h-14 w-full rounded-2xl text-base font-black"><Save className="size-5" />{pending ? "Đang lưu..." : "LƯU KẾT QUẢ"}</Button>;
}

export function MatchScoreboard({ match }: { match: MatchDetailDto }) {
  const router = useRouter();
  const [sideAScore, setSideAScore] = useState(match.sides[0].score ?? 0);
  const [sideBScore, setSideBScore] = useState(match.sides[1].score ?? 0);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(match.notes.map((note) => [note.playerId, note.content])),
  );
  const [state, action] = useActionState(saveMatchScoreAction, initialActionState);
  const [liveScoreStatus, setLiveScoreStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hasChangedScore = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = match.status === "FINISHED";

  const persistLiveScore = useCallback(async (showToast: boolean) => {
    setLiveScoreStatus("saving");
    const formData = new FormData();
    formData.set("matchId", match.id);
    formData.set("sideAScore", String(sideAScore));
    formData.set("sideBScore", String(sideBScore));
    const result = await updateMatchScoreAction(initialActionState, formData);
    if (result.status === "success") {
      setLiveScoreStatus("saved");
      if (showToast) toast.success(result.message);
    } else {
      setLiveScoreStatus("idle");
      if (showToast || result.message) toast.error(result.message);
    }
  }, [match.id, sideAScore, sideBScore]);

  useEffect(() => {
    if (!hasChangedScore.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { void persistLiveScore(false); }, 900);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [persistLiveScore]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.push(match.tournamentId ? `/tournaments/${match.tournamentId}` : "/history");
    }
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [match.tournamentId, router, state]);

  if (finished) {
    return (
      <Card className="border-primary/20 bg-card/80"><CardContent className="space-y-6 py-8 text-center">
        <p className="text-sm font-black tracking-[0.2em] text-primary">KẾT QUẢ CHUNG CUỘC</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><SideIdentity side={match.sides[0]} /><p className="text-5xl font-black tabular-nums sm:text-7xl">{match.sides[0].score} <span className="text-muted-foreground">-</span> {match.sides[1].score}</p><SideIdentity side={match.sides[1]} /></div>
        {match.notes.length > 0 ? <div className="rounded-xl border border-white/10 bg-background/40 p-4 text-left"><p className="text-xs font-black tracking-[0.16em] text-primary">CẢM NHẬN SAU TRẬN</p><div className="mt-3 space-y-2 text-sm">{match.notes.map((note) => <p key={note.playerId}><span className="font-bold">{match.sides.flatMap((side) => side.players).find((player) => player.id === note.playerId)?.name}:</span> <span className="text-muted-foreground">{note.content}</span></p>)}</div></div> : null}
        <Button asChild variant="outline"><Link href="/history">Xem lịch sử trận đấu</Link></Button>
      </CardContent></Card>
    );
  }

  return (
    <form action={action} className="space-y-6" onSubmit={() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="sideAScore" value={sideAScore} />
      <input type="hidden" name="sideBScore" value={sideBScore} />
      <input
        type="hidden"
        name="notes"
        value={JSON.stringify(
          Object.entries(notes)
            .map(([playerId, content]) => ({ playerId, content: content.trim() }))
            .filter((note) => note.content.length > 0),
        )}
      />
      <Card className="border-primary/20 bg-card/80"><CardContent className="space-y-7 py-7">
        <p className="text-center text-sm font-black tracking-[0.2em] text-primary">NHẬP TỈ SỐ</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-5">
          <ScoreControl label="Side A" score={sideAScore} setScore={(score) => { hasChangedScore.current = true; setSideAScore(score); }} identity={<SideIdentity side={match.sides[0]} />} />
          <p className="text-xl font-black text-primary sm:text-3xl">VS</p>
          <ScoreControl label="Side B" score={sideBScore} setScore={(score) => { hasChangedScore.current = true; setSideBScore(score); }} identity={<SideIdentity side={match.sides[1]} />} />
        </div>
      </CardContent></Card>
      <Card className="border-white/10 bg-card/80"><CardContent className="space-y-4 py-6">
        <div><p className="font-black">Cảm nhận sau trận <span className="text-muted-foreground">(không bắt buộc)</span></p><p className="mt-1 text-sm text-muted-foreground">Mỗi tuyển thủ có thể để lại một câu. Ghi chú sẽ được gửi kèm Discord.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{match.sides.flatMap((side) => side.players).map((player) => <label key={player.id} className="space-y-2"><span className="text-sm font-bold">{player.name}</span><Textarea value={notes[player.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [player.id]: event.target.value }))} maxLength={500} placeholder="Còn gì để nói không?" className="min-h-24 resize-none" /></label>)}</div>
      </CardContent></Card>
      {state.status === "error" ? <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{state.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" size="lg" disabled={liveScoreStatus === "saving"} onClick={() => void persistLiveScore(true)} className="h-14 rounded-2xl text-base font-black">
          <CloudUpload className="size-5" /> {liveScoreStatus === "saving" ? "Đang cập nhật..." : "CẬP NHẬT TỈ SỐ"}
        </Button>
        <SaveButton />
      </div>
      <p aria-live="polite" className="text-center text-xs text-muted-foreground">{liveScoreStatus === "saved" ? "Tỉ số live đã được lưu." : "Tỉ số sẽ tự lưu sau 1 giây khi bạn ngừng bấm."}</p>
    </form>
  );
}

function ScoreControl({ label, score, setScore, identity }: { label: string; score: number; setScore: (value: number) => void; identity: React.ReactNode }) {
  return <div className="space-y-4"><div className="min-h-20">{identity}</div><div className="flex flex-col items-center gap-3"><Button type="button" variant="outline" size="icon-lg" aria-label={`Tăng tỉ số ${label}`} onClick={() => setScore(Math.min(99, score + 1))}><Plus className="size-6" /></Button><p className="min-w-20 text-center text-6xl font-black tabular-nums sm:text-8xl">{score}</p><Button type="button" variant="outline" size="icon-lg" aria-label={`Giảm tỉ số ${label}`} disabled={score === 0} onClick={() => setScore(Math.max(0, score - 1))}><Minus className="size-6" /></Button></div></div>;
}
