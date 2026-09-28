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

function friendlyHeadline({
  sideAName,
  sideBName,
  sideAScore,
  sideBScore,
}: {
  sideAName: string;
  sideBName: string;
  sideAScore: number;
  sideBScore: number;
}) {
  if (sideAScore === sideBScore) {
    return `${sideAName} và ${sideBName} giằng co ${sideAScore}–${sideBScore}, chưa ai chịu cúi đầu`;
  }

  const winnerName = sideAScore > sideBScore ? sideAName : sideBName;
  const loserName = sideAScore > sideBScore ? sideBName : sideAName;
  const winnerScore = Math.max(sideAScore, sideBScore);
  const loserScore = Math.min(sideAScore, sideBScore);
  const score = `${winnerScore}–${loserScore}`;
  const margin = winnerScore - loserScore;

  if (margin >= 3) return `${winnerName} thị uy ${score}, ${loserName} chỉ biết nghe tiếng gáy`;
  if (margin === 2) return `${winnerName} thắng gọn ${loserName} ${score}, kèo này không phải bàn`;
  return `${winnerName} bóp tim ${loserName} ${score}, căng đến phút chót`;
}

export function buildArenaNews({ matches, tournaments, limit = 5 }: { matches: MatchNewsInput[]; tournaments: TournamentNewsInput[]; limit?: number }): ArenaNewsItem[] {
  const friendlyNews = matches.flatMap((match) => {
    const [sideA, sideB] = match.sides;
    const sideAScore = sideA.score;
    const sideBScore = sideB.score;
    if (match.tournament || sideAScore === null || sideBScore === null) return [];
    const sideAName = playerNames(sideA.players);
    const sideBName = playerNames(sideB.players);
    return [{ id: `friendly-${match.id}`, href: `/matches/${match.id}`, kind: "FRIENDLY" as const, headline: friendlyHeadline({ sideAName, sideBName, sideAScore, sideBScore }), detail: match.isRanked ? "Giao hữu · tính Điểm Arena" : "Giao hữu · không xếp hạng", occurredAt: match.playedAt ? new Date(match.playedAt) : new Date(0) }];
  });

  const tournamentNews = tournaments.flatMap((tournament) => {
    const champion = getTournamentPlacements({ type: tournament.type, status: tournament.status, competitors: tournament.competitors, fixtures: tournament.fixtures }).find((placement) => placement.place === 1);
    const winner = champion ? tournament.competitors.find((competitor) => competitor.id === champion.competitorId) : null;
    if (!winner) return [];
    return [{ id: `tournament-${tournament.id}`, href: `/tournaments/${tournament.id}`, kind: "TOURNAMENT" as const, headline: `${winner.name} lên ngôi ${tournament.name}, ai còn dám cãi?`, detail: `${tournament.type === "LEAGUE" ? "League" : "Knockout"} · giải đã hoàn tất`, occurredAt: tournament.updatedAt }];
  });

  return [...friendlyNews, ...tournamentNews].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, limit);
}
