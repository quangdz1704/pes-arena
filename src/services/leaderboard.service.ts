import "server-only";

import { listLeaderboardMatchRows } from "@/repositories/match.repository";

import {
  buildLeaderboard,
  getLeaderboardStartDate,
  type LeaderboardFilters,
} from "./leaderboard";

export async function getLeaderboard(filters: LeaderboardFilters) {
  const rows = await listLeaderboardMatchRows({
    matchMode: filters.matchMode,
    startDate: null,
  });

  return buildLeaderboard(rows, filters.sort, getLeaderboardStartDate(filters.period));
}
