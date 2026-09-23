import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { teamTierEnum, teamTypeEnum } from "./enums";

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    nickname: varchar("nickname", { length: 100 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("players_name_unique").on(table.name),
    index("players_active_idx").on(table.isActive),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    shortName: varchar("short_name", { length: 12 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    type: teamTypeEnum("type").notNull(),
    tier: teamTierEnum("tier").notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    rating: integer("rating").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("teams_name_unique").on(table.name),
    index("teams_type_tier_active_idx").on(
      table.type,
      table.tier,
      table.isActive,
    ),
    check(
      "teams_rating_range_check",
      sql`${table.rating} between 1 and 100`,
    ),
  ],
);

export const teamPools = pgTable(
  "team_pools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 16 }),
    description: varchar("description", { length: 300 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("team_pools_name_unique").on(table.name)],
);

export const teamPoolMembers = pgTable(
  "team_pool_members",
  {
    teamPoolId: uuid("team_pool_id")
      .notNull()
      .references(() => teamPools.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "team_pool_members_pk",
      columns: [table.teamPoolId, table.teamId],
    }),
    index("team_pool_members_team_idx").on(table.teamId),
  ],
);

export const appSettings = pgTable("app_settings", {
  id: varchar("id", { length: 32 }).primaryKey().default("default"),
  appName: varchar("app_name", { length: 100 })
    .default("PES Arena")
    .notNull(),
  defaultRanked: boolean("default_ranked").default(true).notNull(),
  minimumMatchesForWinrateRanking: integer(
    "minimum_matches_for_winrate_ranking",
  )
    .default(10)
    .notNull(),
  minimumWeeklyMatches: integer("minimum_weekly_matches")
    .default(3)
    .notNull(),
  defaultLeaderboardSort: varchar("default_leaderboard_sort", { length: 32 })
    .default("WINS")
    .notNull(),
  tournamentWinPoints: integer("tournament_win_points").default(3).notNull(),
  tournamentDrawPoints: integer("tournament_draw_points").default(1).notNull(),
  tournamentLossPoints: integer("tournament_loss_points")
    .default(0)
    .notNull(),
  autoWeeklyReportEnabled: boolean("auto_weekly_report_enabled")
    .default(false)
    .notNull(),
  weeklyReportDay: integer("weekly_report_day").default(0).notNull(),
  weeklyReportHour: integer("weekly_report_hour").default(23).notNull(),
  includeWeeklyHonors: boolean("include_weekly_honors").default(true).notNull(),
  includeWeeklyShame: boolean("include_weekly_shame").default(true).notNull(),
  includeTrollCaption: boolean("include_troll_caption").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
