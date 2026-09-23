import { pgEnum } from "drizzle-orm/pg-core";

export const teamTypeEnum = pgEnum("team_type", ["CLUB", "NATIONAL"]);
export const teamTierEnum = pgEnum("team_tier", ["S", "A", "B", "C"]);

export const matchModeEnum = pgEnum("match_mode", [
  "ONE_V_ONE",
  "TWO_V_TWO",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "CREATED",
  "PLAYING",
  "FINISHED",
  "CANCELLED",
]);
export const randomModeEnum = pgEnum("random_mode", ["PURE", "BALANCED"]);
export const matchSideEnum = pgEnum("match_side", ["A", "B"]);

export const tournamentTypeEnum = pgEnum("tournament_type", [
  "LEAGUE",
  "KNOCKOUT",
]);
export const tournamentStatusEnum = pgEnum("tournament_status", [
  "DRAFT",
  "ACTIVE",
  "FINISHED",
  "CANCELLED",
]);

export const discordReportTypeEnum = pgEnum("discord_report_type", [
  "WEEKLY_LEADERBOARD",
  "MANUAL_LEADERBOARD",
]);
export const discordReportStatusEnum = pgEnum("discord_report_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);
