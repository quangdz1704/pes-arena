import Link from "next/link";

import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { listPlayers } from "@/services/player.service";
import { listTournaments } from "@/services/tournament.service";
import { TournamentForm } from "./league-form";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const ready = isDatabaseConfigured();
  const [players, tournaments] = ready
    ? await Promise.all([listPlayers(), listTournaments()])
    : [[], []];
  const activeTournaments = tournaments.filter((tournament) => tournament.status === "ACTIVE");
  const tournamentHistory = tournaments.filter((tournament) => tournament.status !== "ACTIVE");

  const tournamentCards = (items: typeof tournaments) => (
    <div className="space-y-3">
      {items.map((tournament) => (
        <Link className="block" href={`/tournaments/${tournament.id}`} key={tournament.id}>
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate font-black">{tournament.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {tournament.type === "KNOCKOUT" ? "Knockout" : "League"} · {tournament.competitors.length} đối thủ · {tournament.fixtures.length} trận · {tournament.status}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-sm font-bold text-primary">Xem <span className="hidden sm:inline">chi tiết </span>→</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeading
        eyebrow="Thi đấu"
        title="Giải đấu"
        description="League vòng tròn hoặc knockout: tự sinh lịch và sẵn sàng bước vào cuộc chiến."
      />
      {ready ? (
        <>
          <Card>
            <CardContent className="p-5">
              <TournamentForm players={players.filter((player) => player.isActive).map((player) => ({ id: player.id, name: player.name }))} />
            </CardContent>
          </Card>
          <section className="space-y-3"><h2 className="text-xl font-black">Giải đang diễn ra</h2>{activeTournaments.length ? tournamentCards(activeTournaments) : <p className="text-sm text-muted-foreground">Chưa có giải nào đang diễn ra.</p>}</section>
          {tournamentHistory.length ? <section className="space-y-3"><h2 className="text-xl font-black">Lịch sử giải</h2>{tournamentCards(tournamentHistory)}</section> : null}
        </>
      ) : (
        <Card><CardContent className="p-6">Cần kết nối database.</CardContent></Card>
      )}
    </div>
  );
}
