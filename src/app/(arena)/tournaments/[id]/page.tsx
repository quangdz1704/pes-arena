import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";
import { getTournament } from "@/services/tournament.service";

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
  const standings = tournament.competitors.map((competitor) => ({
    ...competitor, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
  }));
  const standingByName = new Map(standings.map((standing) => [standing.name, standing]));
  for (const fixture of tournament.fixtures) {
    if (fixture.matchStatus !== "FINISHED" || fixture.homeScore === null || fixture.awayScore === null) continue;
    const home = standingByName.get(fixture.homeName);
    const away = standingByName.get(fixture.awayName);
    if (!home || !away) continue;
    home.played += 1; away.played += 1;
    home.goalsFor += fixture.homeScore; home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore; away.goalsAgainst += fixture.homeScore;
    if (fixture.homeScore > fixture.awayScore) { home.wins += 1; away.losses += 1; home.points += 3; }
    else if (fixture.homeScore < fixture.awayScore) { away.wins += 1; home.losses += 1; away.points += 3; }
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
  }
  standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="space-y-3">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-foreground" href="/tournaments">
          ← Quay lại giải đấu
        </Link>
        <PageHeading
          eyebrow="League 1v1"
          title={tournament.name}
          description={`${tournament.competitors.length} đối thủ · ${tournament.fixtures.length} trận · ${tournament.status}`}
        />
      </div>

      <Card>
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
                {standings.map((competitor, index) => (
                  <tr className="border-b last:border-0" key={competitor.id}>
                    <td className="px-2 py-3">{index + 1}</td><td className="px-2 py-3 font-semibold">{competitor.name}</td><td className="px-2 py-3 text-center">{competitor.played}</td><td className="px-2 py-3 text-center">{competitor.wins}</td><td className="px-2 py-3 text-center">{competitor.draws}</td><td className="px-2 py-3 text-center">{competitor.losses}</td><td className="px-2 py-3 text-center">{competitor.goalsFor - competitor.goalsAgainst}</td><td className="px-2 py-3 text-right font-black">{competitor.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-black">Lịch thi đấu</h2>
        {[...rounds.entries()].map(([round, fixtures]) => (
          <Card key={round}>
            <CardContent className="p-5">
              <h3 className="font-black">Vòng {round}</h3>
              <div className="mt-3 divide-y rounded-md border">
                {fixtures.map((fixture) => (
                  <div className="flex items-center justify-between gap-4 px-4 py-3" key={fixture.id}>
                    <p className="font-semibold">{fixture.homeName} <span className="text-muted-foreground">vs</span> {fixture.awayName}</p>
                    {fixture.matchId ? (
                      <Link className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground" href={`/matches/${fixture.matchId}`}>
                        {fixture.matchStatus === "FINISHED" ? `${fixture.homeScore} - ${fixture.awayScore}` : "Vào trận"}
                      </Link>
                    ) : (
                      <Link className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground" href={`/matches/new?fixture=${fixture.id}`}>
                        Bắt đầu trận
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
