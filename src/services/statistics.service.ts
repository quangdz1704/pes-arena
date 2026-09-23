import "server-only";

import { listLeaderboardMatchRows } from "@/repositories/match.repository";

import { buildStatistics } from "./statistics";

export async function getStatisticsSnapshot() {
  return buildStatistics(await listLeaderboardMatchRows({ matchMode: "ALL", startDate: null }));
}
