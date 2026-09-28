export type LeaderboardPeriod = "ALL" | "DAY" | "SEVEN_DAYS" | "THIRTY_DAYS";
export type LeaderboardMatchMode = "ALL" | "ONE_V_ONE" | "TWO_V_TWO";
export type LeaderboardSort = "RATING" | "WINS" | "WINRATE" | "MATCHES" | "GF";

export type LeaderboardMatchRow = {
  matchId: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  playedAt: Date | null;
  playerId: string;
  playerName: string;
  playerAvatarUrl?: string | null;
  side: "A" | "B";
  score: number | null;
};

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  avatarUrl: string | null;
  matches: number;
  ratedMatches: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  rating: number;
  ratingDelta: number;
  isProvisional: boolean;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  currentStreak: number;
};

export type LeaderboardFilters = {
  period: LeaderboardPeriod;
  matchMode: LeaderboardMatchMode;
  sort: LeaderboardSort;
};

const INITIAL_RATING = 1000;
const PROVISIONAL_MATCHES = 5;
const vietnamOffsetMilliseconds = 7 * 60 * 60 * 1000;

function startOfVietnamDayUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day) - vietnamOffsetMilliseconds);
}

export function getLeaderboardStartDate(period: LeaderboardPeriod, now = new Date()) {
  if (period === "ALL") return null;

  const vietnamNow = new Date(now.getTime() + vietnamOffsetMilliseconds);
  const year = vietnamNow.getUTCFullYear();
  const month = vietnamNow.getUTCMonth();
  const day = vietnamNow.getUTCDate();
  const daysToInclude = period === "DAY" ? 1 : period === "SEVEN_DAYS" ? 7 : 30;
  return startOfVietnamDayUtc(year, month, day - (daysToInclude - 1));
}

type MutableEntry = Omit<LeaderboardEntry, "rank" | "winRate" | "goalDifference" | "rating" | "ratingDelta" | "isProvisional">;

function expectedScore(ownRating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - ownRating) / 400));
}

function getKFactor(matches: number) {
  if (matches < 10) return 32;
  if (matches < 30) return 20;
  return 12;
}

function headToHeadKey(first: string, second: string) {
  return [first, second].sort().join(":");
}

function getCompletedMatches(rows: LeaderboardMatchRow[]) {
  const matchesById = new Map<string, LeaderboardMatchRow[]>();
  for (const row of rows) {
    const matchRows = matchesById.get(row.matchId) ?? [];
    matchRows.push(row);
    matchesById.set(row.matchId, matchRows);
  }

  return [...matchesById.values()]
    .map((matchRows) => {
      const scoreA = matchRows.find((row) => row.side === "A")?.score;
      const scoreB = matchRows.find((row) => row.side === "B")?.score;
      return scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined
        ? null
        : { matchRows, scoreA, scoreB };
    })
    .filter((match): match is { matchRows: LeaderboardMatchRow[]; scoreA: number; scoreB: number } => Boolean(match))
    .sort((first, second) => (first.matchRows[0]?.playedAt?.getTime() ?? 0) - (second.matchRows[0]?.playedAt?.getTime() ?? 0));
}

export function buildLeaderboard(
  rows: LeaderboardMatchRow[],
  sort: LeaderboardSort = "RATING",
  periodStart: Date | null = null,
): LeaderboardEntry[] {
  const ratings = new Map<string, number>();
  const ratedMatches = new Map<string, number>();
  const streaks = new Map<string, number>();
  const ratingAtPeriodStart = new Map<string, number>();
  const entries = new Map<string, MutableEntry>();
  const headToHead = new Map<string, { first: string; second: string; firstPoints: number; matches: number }>();

  for (const { matchRows, scoreA, scoreB } of getCompletedMatches(rows)) {
    const sideA = matchRows.filter((row) => row.side === "A");
    const sideB = matchRows.filter((row) => row.side === "B");
    if (sideA.length === 0 || sideB.length === 0) continue;
    const playedAt = matchRows[0]?.playedAt ?? null;
    const isInPeriod = !periodStart || (playedAt !== null && playedAt >= periodStart);
    const sideARating = sideA.reduce((total, row) => total + (ratings.get(row.playerId) ?? INITIAL_RATING), 0) / sideA.length;
    const sideBRating = sideB.reduce((total, row) => total + (ratings.get(row.playerId) ?? INITIAL_RATING), 0) / sideB.length;
    const resultA = scoreA === scoreB ? 0.5 : scoreA > scoreB ? 1 : 0;

    for (const row of matchRows) {
      if (isInPeriod && !ratingAtPeriodStart.has(row.playerId)) {
        ratingAtPeriodStart.set(row.playerId, ratings.get(row.playerId) ?? INITIAL_RATING);
      }
    }

    for (const row of sideA) {
      const currentRating = ratings.get(row.playerId) ?? INITIAL_RATING;
      const matchesBefore = ratedMatches.get(row.playerId) ?? 0;
      ratings.set(row.playerId, currentRating + getKFactor(matchesBefore) * (resultA - expectedScore(sideARating, sideBRating)));
      ratedMatches.set(row.playerId, matchesBefore + 1);
    }
    for (const row of sideB) {
      const currentRating = ratings.get(row.playerId) ?? INITIAL_RATING;
      const matchesBefore = ratedMatches.get(row.playerId) ?? 0;
      ratings.set(row.playerId, currentRating + getKFactor(matchesBefore) * ((1 - resultA) - expectedScore(sideBRating, sideARating)));
      ratedMatches.set(row.playerId, matchesBefore + 1);
    }

    for (const [ownSide, score, opponentScore] of [[sideA, scoreA, scoreB], [sideB, scoreB, scoreA]] as const) {
      const outcome = Math.sign(score - opponentScore);
      for (const row of ownSide) {
        const nextStreak = outcome > 0 ? (streaks.get(row.playerId) ?? 0) + 1 : 0;
        streaks.set(row.playerId, nextStreak);
        if (!isInPeriod) continue;
        const entry = entries.get(row.playerId) ?? {
          playerId: row.playerId,
          playerName: row.playerName,
          avatarUrl: row.playerAvatarUrl ?? null,
          matches: 0,
          ratedMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          currentStreak: 0,
        };
        entry.matches += 1;
        entry.goalsFor += score;
        entry.goalsAgainst += opponentScore;
        entry.currentStreak = nextStreak;
        if (outcome > 0) { entry.wins += 1; entry.points += 3; }
        else if (outcome < 0) entry.losses += 1;
        else { entry.draws += 1; entry.points += 1; }
        entries.set(row.playerId, entry);
      }

    }

    for (const playerA of sideA) {
      for (const playerB of sideB) {
        const [first, second] = [playerA.playerId, playerB.playerId].sort();
        const key = headToHeadKey(first, second);
        const current = headToHead.get(key) ?? { first, second, firstPoints: 0, matches: 0 };
        current.matches += 1;
        current.firstPoints += first === playerA.playerId ? resultA : 1 - resultA;
        headToHead.set(key, current);
      }
    }
  }

  const finalized = [...entries.values()].map((entry) => {
    const rating = Math.round(ratings.get(entry.playerId) ?? INITIAL_RATING);
    const ratingAtStart = ratingAtPeriodStart.get(entry.playerId) ?? rating;
    const playerRatedMatches = ratedMatches.get(entry.playerId) ?? 0;
    return {
      ...entry,
      ratedMatches: playerRatedMatches,
      rating,
      ratingDelta: rating - Math.round(ratingAtStart),
      isProvisional: playerRatedMatches < PROVISIONAL_MATCHES,
      winRate: entry.matches === 0 ? 0 : Math.round((entry.wins / entry.matches) * 100),
      goalDifference: entry.goalsFor - entry.goalsAgainst,
      rank: 0,
    };
  });

  const compareByRating = (first: LeaderboardEntry, second: LeaderboardEntry) => {
    if (second.rating !== first.rating) return second.rating - first.rating;
    const duel = headToHead.get(headToHeadKey(first.playerId, second.playerId));
    if (duel && duel.matches >= 2 && duel.firstPoints * 2 !== duel.matches) {
      const firstWonDuel = duel.first === first.playerId ? duel.firstPoints * 2 > duel.matches : duel.firstPoints * 2 < duel.matches;
      return firstWonDuel ? -1 : 1;
    }
    if (second.ratedMatches !== first.ratedMatches) return second.ratedMatches - first.ratedMatches;
    if (second.winRate !== first.winRate) return second.winRate - first.winRate;
    return first.playerName.localeCompare(second.playerName, "vi");
  };
  let stableRank = 0;
  const ranked = [...finalized]
    .sort((first, second) => Number(first.isProvisional) - Number(second.isProvisional) || compareByRating(first, second))
    .map((entry) => ({ ...entry, rank: entry.isProvisional ? 0 : ++stableRank }));
  const comparisonBySort: Record<LeaderboardSort, (entry: LeaderboardEntry) => number> = {
    RATING: (entry) => entry.rating,
    WINS: (entry) => entry.wins,
    WINRATE: (entry) => entry.winRate,
    MATCHES: (entry) => entry.matches,
    GF: (entry) => entry.goalsFor,
  };
  return sort === "RATING" ? ranked : [...ranked].sort((first, second) => comparisonBySort[sort](second) - comparisonBySort[sort](first) || compareByRating(first, second));
}

export const arenaRating = { initial: INITIAL_RATING, provisionalMatches: PROVISIONAL_MATCHES };
