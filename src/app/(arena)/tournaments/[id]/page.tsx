import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Medal, Trophy } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getKnockoutRoundLabel } from "@/services/knockout";
import { getTournament } from "@/services/tournament.service";
import { buildTournamentStandings, getTournamentPlacements } from "@/services/tournament-results";

import { CancelTournamentButton } from "./cancel-tournament-button";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const rounds = new Map<number, typeof tournament.fixtures>();
  for (const fixture of tournament.fixtures) {
    rounds.set(fixture.round, [...(rounds.get(fixture.round) ?? []), fixture]);
  }
  const knockoutTotalRounds = Math.log2(tournament.competitors.length);
  const standings = buildTournamentStandings(tournament.competitors, tournament.fixtures);
  const placements = getTournamentPlacements({
    type: tournament.type,
    status: tournament.status,
    competitors: tournament.competitors,
    fixtures: tournament.fixtures,
  });
  const competitorById = new Map(tournament.competitors.map((competitor) => [competitor.id, competitor]));
  const podium = ([1, 2, 3] as const).map((place) => ({
    place,
    competitors: placements
      .filter((placement) => placement.place === place)
      .map((placement) => competitorById.get(placement.competitorId))
      .filter((competitor): competitor is (typeof tournament.competitors)[number] => Boolean(competitor)),
  })).filter((entry) => entry.competitors.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="space-y-3">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-foreground" href="/tournaments">
          ← Quay lại giải đấu
        </Link>
        <PageHeading
          eyebrow={`${tournament.type === "KNOCKOUT" ? "Knockout" : "League"} ${tournament.matchMode === "ONE_V_ONE" ? "1v1" : "2v2"}`}
          title={tournament.name}
          description={`${tournament.competitors.length} đối thủ · ${tournament.fixtures.length} trận${tournament.type === "LEAGUE" && tournament.isHomeAndAway ? " · lượt đi–về" : ""} · ${tournament.status}`}
          action={tournament.status === "ACTIVE" ? <CancelTournamentButton tournamentId={tournament.id} /> : undefined}
        />
      </div>

      {podium.length > 0 ? (
        <Card className="overflow-hidden border-amber-300/25 bg-gradient-to-br from-amber-300/10 via-card to-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2"><Trophy className="size-5 text-amber-300" /><div><h2 className="font-black">Bảng vinh danh</h2><p className="text-sm text-muted-foreground">Thành tích chính thức của {tournament.name}.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {podium.map(({ place, competitors }) => <PodiumCard competitors={competitors} key={place} place={place} />)}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tournament.type === "LEAGUE" ? <Card>
        <CardContent className="p-5">
          <h2 className="font-black">Bảng điểm</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lịch đã được tạo. Bảng điểm sẽ cập nhật khi các trận trong giải có kết quả.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr><th className="px-2 py-2">#</th><th className="px-2 py-2">Tuyển thủ</th><th className="px-2 py-2 text-center">T</th><th className="px-2 py-2 text-center">W</th><th className="px-2 py-2 text-center">D</th><th className="px-2 py-2 text-center">L</th><th className="px-2 py-2 text-center">HS</th><th className="px-2 py-2 text-right">Điểm</th></tr>
              </thead>
              <tbody>
                {standings.map((competitor) => (
                  <tr className="border-b last:border-0" key={competitor.id}>
                    <td className="px-2 py-3">{competitor.rank}</td><td className="px-2 py-3 font-semibold">{competitor.name}</td><td className="px-2 py-3 text-center">{competitor.played}</td><td className="px-2 py-3 text-center">{competitor.wins}</td><td className="px-2 py-3 text-center">{competitor.draws}</td><td className="px-2 py-3 text-center">{competitor.losses}</td><td className="px-2 py-3 text-center">{competitor.goalsFor - competitor.goalsAgainst}</td><td className="px-2 py-3 text-right font-black">{competitor.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card> : (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-black">Nhánh đấu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Đội thắng sẽ tự động đi tiếp khi kết quả trận được lưu. Knockout không chấp nhận tỷ số hoà.
            </p>
            {tournament.status !== "FINISHED" ? <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">🏆 Chiếc cúp vẫn đang chờ chủ nhân.</p> : null}
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-black">Lịch thi đấu</h2>
        {[...rounds.entries()].map(([round, fixtures]) => (
          <Card key={round}>
            <CardContent className="p-5">
              <h3 className="font-black">{tournament.type === "KNOCKOUT" ? getKnockoutRoundLabel(round, knockoutTotalRounds) : `Vòng ${round}`}</h3>
              <div className="mt-3 divide-y rounded-md border">
                {fixtures.map((fixture) => (
                  <div className="flex items-center justify-between gap-4 px-4 py-3" key={fixture.id}>
                    <p className="font-semibold">{fixture.homeName}{fixture.homeTeamName ? <span className="text-sm font-medium text-primary"> · {fixture.homeTeamName}</span> : null} <span className="text-muted-foreground">vs</span> {fixture.awayName}{fixture.awayTeamName ? <span className="text-sm font-medium text-primary"> · {fixture.awayTeamName}</span> : null}</p>
                    {fixture.matchId ? (
                      <Link className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground" href={`/matches/${fixture.matchId}`}>
                        {fixture.matchStatus === "FINISHED" ? `${fixture.homeScore} - ${fixture.awayScore}` : "Vào trận"}
                      </Link>
                    ) : tournament.status === "ACTIVE" ? (
                      <Link className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground" href={`/matches/new?fixture=${fixture.id}`}>
                        Bắt đầu trận
                      </Link>
                    ) : (
                      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Đã huỷ</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {tournament.type === "KNOCKOUT" && tournament.status === "ACTIVE" && rounds.size < knockoutTotalRounds ? (
          <p className="text-sm text-muted-foreground">Vòng kế tiếp sẽ xuất hiện ngay khi tất cả trận của vòng hiện tại đã có kết quả.</p>
        ) : null}
      </section>
    </div>
  );
}

function PodiumCard({
  place,
  competitors,
}: {
  place: 1 | 2 | 3;
  competitors: Array<{ id: string; name: string }>;
}) {
  const label = place === 1 ? "Vô địch" : place === 2 ? "Á quân" : competitors.length > 1 ? "Đồng hạng ba" : "Hạng ba";
  const Icon = place === 1 ? Crown : Medal;
  const color = place === 1 ? "border-amber-300/35 bg-amber-300/10 text-amber-200" : place === 2 ? "border-slate-300/25 bg-slate-300/10 text-slate-100" : "border-amber-700/30 bg-amber-700/10 text-amber-500";
  return <div className={`rounded-xl border p-4 text-center ${color}`}><Icon className="mx-auto size-7" /><p className="mt-2 text-xs font-black uppercase tracking-[0.16em]">{label}</p><p className="mt-1 font-black text-foreground">{competitors.map((competitor) => competitor.name).join(" · ")}</p></div>;
}
