export type LeaderboardPeriod = "ALL" | "DAY" | "SEVEN_DAYS" | "THIRTY_DAYS";
export type LeaderboardMatchMode = "ALL" | "ONE_V_ONE" | "TWO_V_TWO";
export type LeaderboardSort = "WINS" | "WINRATE" | "MATCHES" | "GF";

export type LeaderboardMatchRow = {
  matchId: string;
  matchMode: "ONE_V_ONE" | "TWO_V_TWO";
  playedAt: Date | null;
  playerId: string;
  playerName: string;
  side: "A" | "B";
  score: number | null;
};

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
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

type MutableEntry = Omit<LeaderboardEntry, "rank" | "winRate" | "goalDifference">;

export function buildLeaderboard(
  rows: LeaderboardMatchRow[],
  sort: LeaderboardSort,
): LeaderboardEntry[] {
  const matchesById = new Map<string, LeaderboardMatchRow[]>();
  for (const row of rows) {
    const matchRows = matchesById.get(row.matchId) ?? [];
    matchRows.push(row);
    matchesById.set(row.matchId, matchRows);
  }

  const entries = new Map<string, MutableEntry>();
  const streaks = new Map<string, number>();
  const matchesInOrder = [...matchesById.values()].sort(
    (first, second) =>
      (first[0]?.playedAt?.getTime() ?? 0) - (second[0]?.playedAt?.getTime() ?? 0),
  );

  for (const matchRows of matchesInOrder) {
    const scoreBySide = new Map<"A" | "B", number>();
    for (const row of matchRows) {
      if (row.score !== null) scoreBySide.set(row.side, row.score);
    }
    const scoreA = scoreBySide.get("A");
    const scoreB = scoreBySide.get("B");
    if (scoreA === undefined || scoreB === undefined) continue;

    for (const row of matchRows) {
      const score = row.side === "A" ? scoreA : scoreB;
      const opponentScore = row.side === "A" ? scoreB : scoreA;
      const outcome = Math.sign(score - opponentScore);
      const entry = entries.get(row.playerId) ?? {
        playerId: row.playerId,
        playerName: row.playerName,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        currentStreak: 0,
      };

      entry.matches += 1;
      entry.goalsFor += score;
      entry.goalsAgainst += opponentScore;
      if (outcome > 0) entry.wins += 1;
      if (outcome === 0) entry.draws += 1;
      if (outcome < 0) entry.losses += 1;

      const nextStreak = outcome > 0 ? (streaks.get(row.playerId) ?? 0) + 1 : 0;
      streaks.set(row.playerId, nextStreak);
      entry.currentStreak = nextStreak;
      entries.set(row.playerId, entry);
    }
  }

  const comparisonBySort: Record<LeaderboardSort, (entry: LeaderboardEntry) => number> = {
    WINS: (entry) => entry.wins,
    WINRATE: (entry) => entry.winRate,
    MATCHES: (entry) => entry.matches,
    GF: (entry) => entry.goalsFor,
  };

  return [...entries.values()]
    .map((entry) => ({
      ...entry,
      rank: 0,
      winRate: entry.matches === 0 ? 0 : Math.round((entry.wins / entry.matches) * 100),
      goalDifference: entry.goalsFor - entry.goalsAgainst,
    }))
    .sort((first, second) => {
      const mainDifference = comparisonBySort[sort](second) - comparisonBySort[sort](first);
      if (mainDifference !== 0) return mainDifference;
      if (second.wins !== first.wins) return second.wins - first.wins;
      if (second.goalDifference !== first.goalDifference) {
        return second.goalDifference - first.goalDifference;
      }
      if (second.goalsFor !== first.goalsFor) return second.goalsFor - first.goalsFor;
      return first.playerName.localeCompare(second.playerName, "vi");
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
