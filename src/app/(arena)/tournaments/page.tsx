import Link from "next/link";

import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { listPlayers } from "@/services/player.service";
import { listTournaments } from "@/services/tournament.service";
import { createLeagueAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const ready = isDatabaseConfigured();
  const [players, tournaments] = ready
    ? await Promise.all([listPlayers(), listTournaments()])
    : [[], []];

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeading
        eyebrow="Thi đấu"
        title="Giải đấu"
        description="League 1v1, tự sinh lịch vòng tròn và sẵn sàng bước vào cuộc chiến."
      />
      {ready ? (
        <>
          <Card>
            <CardContent className="p-5">
              <form
                action={async (formData) => {
                  "use server";
                  await createLeagueAction({ status: "idle" }, formData);
                }}
                className="space-y-4"
              >
                <input className="h-10 w-full rounded border bg-background px-3" name="name" placeholder="Tên giải đấu" required />
                <div className="grid gap-2 sm:grid-cols-3">
                  {players.filter((player) => player.isActive).map((player) => (
                    <label className="flex gap-2 rounded border p-3" key={player.id}>
                      <input name="playerIds" type="checkbox" value={player.id} />
                      {player.name}
                    </label>
                  ))}
                </div>
                <button className="rounded bg-primary px-4 py-2 font-bold text-primary-foreground" type="submit">
                  Tạo League 1v1 & sinh lịch
                </button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <Link className="block" href={`/tournaments/${tournament.id}`} key={tournament.id}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-black">{tournament.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.competitors.length} đối thủ · {tournament.fixtures.length} trận · {tournament.status}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">Xem chi tiết →</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Card><CardContent className="p-6">Cần kết nối database.</CardContent></Card>
      )}
    </div>
  );
}
