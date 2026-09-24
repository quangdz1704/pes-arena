import type { LeaderboardMatchRow } from "./leaderboard";

export type PlayerRadarMetric = {
  label: string;
  value: number;
  detail: string;
};

export type PlayerProfileStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  currentStreak: number;
  winRate: number;
  radar: PlayerRadarMetric[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getScores(rows: LeaderboardMatchRow[]) {
  const scoreA = rows.find((row) => row.side === "A")?.score;
  const scoreB = rows.find((row) => row.side === "B")?.score;
  return scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined
    ? null
    : { scoreA, scoreB };
}

export function buildPlayerProfileStats(playerId: string, rows: LeaderboardMatchRow[]): PlayerProfileStats {
  const rowsByMatch = new Map<string, LeaderboardMatchRow[]>();
  for (const row of rows) {
    const matchRows = rowsByMatch.get(row.matchId) ?? [];
    matchRows.push(row);
    rowsByMatch.set(row.matchId, matchRows);
  }

  const playedMatches = [...rowsByMatch.values()]
    .map((matchRows) => ({ matchRows, scores: getScores(matchRows) }))
    .filter((entry): entry is { matchRows: LeaderboardMatchRow[]; scores: { scoreA: number; scoreB: number } } => Boolean(entry.scores));
  const playerMatchCounts = new Map<string, number>();
  for (const { matchRows } of playedMatches) {
    for (const id of new Set(matchRows.map((row) => row.playerId))) {
      playerMatchCounts.set(id, (playerMatchCounts.get(id) ?? 0) + 1);
    }
  }

  const outcomes: number[] = [];
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;

  for (const { matchRows, scores } of playedMatches) {
    const playerRow = matchRows.find((row) => row.playerId === playerId);
    if (!playerRow) continue;
    const score = playerRow.side === "A" ? scores.scoreA : scores.scoreB;
    const opponentScore = playerRow.side === "A" ? scores.scoreB : scores.scoreA;
    const outcome = Math.sign(score - opponentScore);
    outcomes.push(outcome);
    goalsFor += score;
    goalsAgainst += opponentScore;
    if (opponentScore === 0) cleanSheets += 1;
    if (outcome > 0) wins += 1;
    else if (outcome < 0) losses += 1;
    else draws += 1;
  }

  const matches = outcomes.length;
  const winRate = matches === 0 ? 0 : Math.round((wins / matches) * 100);
  const averageGoalsFor = matches === 0 ? 0 : goalsFor / matches;
  const averageGoalsAgainst = matches === 0 ? 0 : goalsAgainst / matches;
  const averageGoalDifference = matches === 0 ? 0 : (goalsFor - goalsAgainst) / matches;
  const recentOutcomes = outcomes.slice(-5);
  const recentForm = recentOutcomes.length === 0 ? 0 : (recentOutcomes.reduce((total, outcome) => total + (outcome > 0 ? 2 : outcome === 0 ? 1 : 0), 0) / (recentOutcomes.length * 2)) * 100;
  const highestMatchCount = Math.max(0, ...playerMatchCounts.values());
  let currentStreak = 0;
  for (const outcome of [...outcomes].reverse()) {
    if (outcome <= 0) break;
    currentStreak += 1;
  }

  return {
    matches, wins, draws, losses, goalsFor, goalsAgainst, cleanSheets, currentStreak, winRate,
    radar: [
      { label: "Winrate", value: winRate, detail: `${winRate}%` },
      { label: "Tấn công", value: clamp((averageGoalsFor / 5) * 100), detail: `${averageGoalsFor.toFixed(1)} GF/trận` },
      { label: "Phòng ngự", value: clamp(100 - (averageGoalsAgainst / 5) * 100), detail: `${averageGoalsAgainst.toFixed(1)} GA/trận` },
      { label: "Hiệu số", value: clamp(50 + (averageGoalDifference / 5) * 50), detail: `${averageGoalDifference >= 0 ? "+" : ""}${averageGoalDifference.toFixed(1)} / trận` },
      { label: "Phong độ", value: clamp(recentForm), detail: `${recentOutcomes.length} trận gần nhất` },
      { label: "Hoạt động", value: highestMatchCount === 0 ? 0 : clamp((matches / highestMatchCount) * 100), detail: `${matches} trận` },
    ],
  };
}
