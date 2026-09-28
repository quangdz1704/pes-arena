import { getTournamentPlacements, type TournamentResultFixture } from "./tournament-results";

type MatchNewsInput = {
  id: string;
  tournament: { id: string; name: string } | null;
  playedAt: string | null;
  isRanked: boolean;
  sides: [
    { score: number | null; players: { name: string }[] },
    { score: number | null; players: { name: string }[] },
  ];
};

type TournamentNewsInput = {
  id: string;
  name: string;
  type: "LEAGUE" | "KNOCKOUT";
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELLED";
  updatedAt: Date;
  competitors: { id: string; name: string; seed: number | null }[];
  fixtures: TournamentResultFixture[];
};

export type ArenaNewsItem = {
  id: string;
  href: string;
  kind: "FRIENDLY" | "TOURNAMENT";
  headline: string;
  detail: string;
  occurredAt: Date;
};

function playerNames(players: { name: string }[]) {
  return players.map((player) => player.name).join(" + ");
}

export function buildArenaNews({ matches, tournaments, limit = 5 }: { matches: MatchNewsInput[]; tournaments: TournamentNewsInput[]; limit?: number }): ArenaNewsItem[] {
  const friendlyNews = matches.flatMap((match) => {
    const [sideA, sideB] = match.sides;
    const sideAScore = sideA.score;
    const sideBScore = sideB.score;
    if (match.tournament || sideAScore === null || sideBScore === null) return [];
    const sideAName = playerNames(sideA.players);
    const sideBName = playerNames(sideB.players);
    const isDraw = sideAScore === sideBScore;
    const winner = sideAScore > sideBScore ? sideA : sideB;
    const loser = sideAScore > sideBScore ? sideB : sideA;

    return [{ id: `friendly-${match.id}`, href: `/matches/${match.id}`, kind: "FRIENDLY" as const, headline: isDraw ? `${sideAName} và ${sideBName} chia điểm ${sideAScore}–${sideBScore}` : `${playerNames(winner.players)} hạ ${playerNames(loser.players)} ${Math.max(sideAScore, sideBScore)}–${Math.min(sideAScore, sideBScore)}`, detail: match.isRanked ? "Giao hữu · tính Điểm Arena" : "Giao hữu · không xếp hạng", occurredAt: match.playedAt ? new Date(match.playedAt) : new Date(0) }];
  });

  const tournamentNews = tournaments.flatMap((tournament) => {
    const champion = getTournamentPlacements({ type: tournament.type, status: tournament.status, competitors: tournament.competitors, fixtures: tournament.fixtures }).find((placement) => placement.place === 1);
    const winner = champion ? tournament.competitors.find((competitor) => competitor.id === champion.competitorId) : null;
    if (!winner) return [];
    return [{ id: `tournament-${tournament.id}`, href: `/tournaments/${tournament.id}`, kind: "TOURNAMENT" as const, headline: `${winner.name} vô địch ${tournament.name}`, detail: `${tournament.type === "LEAGUE" ? "League" : "Knockout"} · giải đã hoàn tất`, occurredAt: tournament.updatedAt }];
  });

  return [...friendlyNews, ...tournamentNews].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, limit);
}
