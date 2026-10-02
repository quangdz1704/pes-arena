export type TournamentResultCompetitor = {
  id: string;
  name: string;
  seed: number | null;
};

export type TournamentResultFixture = {
  round: number;
  homeCompetitorId: string;
  awayCompetitorId: string;
  matchStatus: "CREATED" | "PLAYING" | "FINISHED" | "CANCELLED" | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type TournamentStanding = TournamentResultCompetitor & {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
};

export type TournamentPlacement = {
  competitorId: string;
  place: 1 | 2 | 3;
};

export type TournamentLeaderCompetitor = TournamentResultCompetitor & {
  players: { id: string; name: string; avatarUrl: string | null }[];
};

export type TournamentLeaders = {
  label: string;
  entries: (TournamentLeaderCompetitor & { rank: number | null; points: number | null })[];
};

export function buildTournamentLeaders({ type, status, competitors, fixtures }: {
  type: "LEAGUE" | "KNOCKOUT";
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELLED";
  competitors: TournamentLeaderCompetitor[];
  fixtures: TournamentResultFixture[];
}): TournamentLeaders {
  if (status === "CANCELLED") return { label: "Giải đã hủy", entries: [] };
  const byId = new Map(competitors.map((competitor) => [competitor.id, competitor]));
  const ordered = [...competitors].sort((left, right) =>
    (left.seed ?? Number.MAX_SAFE_INTEGER) - (right.seed ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, "vi"),
  );

  if (type === "LEAGUE" && fixtures.some(isFinishedScore)) {
    return {
      label: status === "FINISHED" ? "Top giải · Chung cuộc" : "Top giải · Tạm thời",
      entries: buildTournamentStandings(competitors, fixtures).slice(0, 4).map((standing) => ({
        ...byId.get(standing.id)!, rank: standing.rank, points: standing.points,
      })),
    };
  }
  if (type === "KNOCKOUT" && status === "FINISHED") {
    return {
      label: "Top giải · Chung cuộc",
      entries: getTournamentPlacements({ type, status, competitors, fixtures }).slice(0, 4).flatMap((placement) => {
        const competitor = byId.get(placement.competitorId);
        return competitor ? [{ ...competitor, rank: placement.place, points: null }] : [];
      }),
    };
  }

  // Knockout contenders have no standings until the final; never invent ranks.
  const eliminated = new Set(fixtures.filter(isFinishedScore).flatMap((fixture) =>
    fixture.homeScore === fixture.awayScore ? [] : [fixture.homeScore > fixture.awayScore ? fixture.awayCompetitorId : fixture.homeCompetitorId],
  ));
  return {
    label: type === "KNOCKOUT" && fixtures.some(isFinishedScore) ? "Đang tranh cúp" : status === "DRAFT" ? "Chờ khai cuộc" : "Chưa có thứ hạng",
    entries: ordered.filter((competitor) => type !== "KNOCKOUT" || !eliminated.has(competitor.id)).slice(0, 4).map((competitor) => ({
      ...competitor, rank: null, points: null,
    })),
  };
}

function isFinishedScore(
  fixture: TournamentResultFixture,
): fixture is TournamentResultFixture & { homeScore: number; awayScore: number } {
  return (
    fixture.matchStatus === "FINISHED" &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null
  );
}

export function buildTournamentStandings(
  competitors: TournamentResultCompetitor[],
  fixtures: TournamentResultFixture[],
): TournamentStanding[] {
  const standings = new Map(
    competitors.map((competitor) => [
      competitor.id,
      {
        ...competitor,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        rank: 0,
      },
    ]),
  );

  for (const fixture of fixtures) {
    if (!isFinishedScore(fixture)) continue;
    const home = standings.get(fixture.homeCompetitorId);
    const away = standings.get(fixture.awayCompetitorId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeScore;
    home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore;
    away.goalsAgainst += fixture.homeScore;

    if (fixture.homeScore > fixture.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...standings.values()]
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.goalsFor - right.goalsAgainst - (left.goalsFor - left.goalsAgainst) ||
        right.goalsFor - left.goalsFor ||
        left.name.localeCompare(right.name, "vi"),
    )
    .map((standing, index) => ({ ...standing, rank: index + 1 }));
}

export function getTournamentPlacements({
  type,
  status,
  competitors,
  fixtures,
}: {
  type: "LEAGUE" | "KNOCKOUT";
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELLED";
  competitors: TournamentResultCompetitor[];
  fixtures: TournamentResultFixture[];
}): TournamentPlacement[] {
  if (status !== "FINISHED") return [];

  if (type === "LEAGUE") {
    return buildTournamentStandings(competitors, fixtures)
      .slice(0, 3)
      .map((standing) => ({ competitorId: standing.id, place: standing.rank as 1 | 2 | 3 }));
  }

  const totalRounds = Math.log2(competitors.length);
  const finalFixture = fixtures.find((fixture) => fixture.round === totalRounds);
  if (!finalFixture || !isFinishedScore(finalFixture) || finalFixture.homeScore === finalFixture.awayScore) {
    return [];
  }

  const championId =
    finalFixture.homeScore > finalFixture.awayScore
      ? finalFixture.homeCompetitorId
      : finalFixture.awayCompetitorId;
  const runnerUpId =
    finalFixture.homeScore > finalFixture.awayScore
      ? finalFixture.awayCompetitorId
      : finalFixture.homeCompetitorId;
  const placements: TournamentPlacement[] = [
    { competitorId: championId, place: 1 },
    { competitorId: runnerUpId, place: 2 },
  ];

  if (totalRounds > 1) {
    for (const fixture of fixtures.filter((item) => item.round === totalRounds - 1)) {
      if (!isFinishedScore(fixture) || fixture.homeScore === fixture.awayScore) continue;
      placements.push({
        competitorId:
          fixture.homeScore > fixture.awayScore
            ? fixture.awayCompetitorId
            : fixture.homeCompetitorId,
        place: 3,
      });
    }
  }

  return placements;
}
