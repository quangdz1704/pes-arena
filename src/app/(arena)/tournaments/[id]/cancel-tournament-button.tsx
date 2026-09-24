"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";

import { cancelTournamentAction } from "../actions";

export function CancelTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(cancelTournamentAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.push("/tournaments");
      router.refresh();
    }
    if (state.status === "error") toast.error(state.message);
  }, [router, state]);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Huỷ giải này? Lịch và các kết quả đã đá sẽ vẫn được lưu.")) event.preventDefault();
      }}
    >
      <input name="tournamentId" type="hidden" value={tournamentId} />
      <Button disabled={pending} size="sm" type="submit" variant="destructive">
        <Ban className="size-4" /> {pending ? "Đang huỷ..." : "Huỷ giải"}
      </Button>
    </form>
  );
}
