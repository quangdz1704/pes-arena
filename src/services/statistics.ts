import type { LeaderboardMatchRow } from "./leaderboard";

export type RivalryEntry = {
  playerId: string;
  playerName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
};

export type PairEntry = {
  key: string;
  playerNames: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
};

export type StatisticsSnapshot = {
  players: Array<{ playerId: string; playerName: string; matches: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>;
  rivalriesByPlayer: Map<string, RivalryEntry[]>;
  pairs: PairEntry[];
};

export function buildStatistics(rows: LeaderboardMatchRow[]): StatisticsSnapshot {
  const matchesById = new Map<string, LeaderboardMatchRow[]>();
  for (const row of rows) {
    const current = matchesById.get(row.matchId) ?? [];
    current.push(row);
    matchesById.set(row.matchId, current);
  }

  const players = new Map<string, StatisticsSnapshot["players"][number]>();
  const rivalries = new Map<string, Map<string, RivalryEntry>>();
  const pairs = new Map<string, Omit<PairEntry, "winRate">>();

  for (const matchRows of matchesById.values()) {
    const sideA = matchRows.filter((row) => row.side === "A");
    const sideB = matchRows.filter((row) => row.side === "B");
    const scoreA = sideA[0]?.score;
    const scoreB = sideB[0]?.score;
    if (scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined) continue;

    for (const [sideRows, opponentRows, score, opponentScore] of [[sideA, sideB, scoreA, scoreB], [sideB, sideA, scoreB, scoreA]] as const) {
      const outcome = Math.sign(score - opponentScore);
      for (const row of sideRows) {
        const player = players.get(row.playerId) ?? { playerId: row.playerId, playerName: row.playerName, matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
        player.matches += 1;
        player.goalsFor += score;
        player.goalsAgainst += opponentScore;
        if (outcome > 0) player.wins += 1;
        else if (outcome < 0) player.losses += 1;
        else player.draws += 1;
        players.set(row.playerId, player);

        const opponents = rivalries.get(row.playerId) ?? new Map<string, RivalryEntry>();
        for (const opponent of opponentRows) {
          const rivalry = opponents.get(opponent.playerId) ?? { playerId: opponent.playerId, playerName: opponent.playerName, matches: 0, wins: 0, draws: 0, losses: 0 };
          rivalry.matches += 1;
          if (outcome > 0) rivalry.wins += 1;
          else if (outcome < 0) rivalry.losses += 1;
          else rivalry.draws += 1;
          opponents.set(opponent.playerId, rivalry);
        }
        rivalries.set(row.playerId, opponents);
      }

      if (sideRows.length === 2) {
        const ordered = [...sideRows].sort((a, b) => a.playerName.localeCompare(b.playerName, "vi"));
        const key = ordered.map((row) => row.playerId).join(":");
        const pair = pairs.get(key) ?? { key, playerNames: ordered.map((row) => row.playerName).join(" + "), matches: 0, wins: 0, draws: 0, losses: 0 };
        pair.matches += 1;
        if (outcome > 0) pair.wins += 1;
        else if (outcome < 0) pair.losses += 1;
        else pair.draws += 1;
        pairs.set(key, pair);
      }
    }
  }

  return {
    players: [...players.values()].sort((a, b) => b.wins - a.wins || b.goalsFor - a.goalsFor || a.playerName.localeCompare(b.playerName, "vi")),
    rivalriesByPlayer: new Map([...rivalries].map(([playerId, entries]) => [playerId, [...entries.values()].sort((a, b) => b.matches - a.matches || b.wins - a.wins)])),
    pairs: [...pairs.values()].map((pair) => ({ ...pair, winRate: Math.round((pair.wins / pair.matches) * 100) })).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.matches - a.matches),
  };
}
