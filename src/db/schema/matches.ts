import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { players, teamPools, teams } from "./core";
import {
  matchModeEnum,
  matchSideEnum,
  matchStatusEnum,
  randomModeEnum,
} from "./enums";
import { tournaments } from "./tournaments";

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchMode: matchModeEnum("match_mode").notNull(),
    status: matchStatusEnum("status").default("CREATED").notNull(),
    tournamentId: uuid("tournament_id").references(() => tournaments.id, {
      onDelete: "set null",
    }),
    teamPoolId: uuid("team_pool_id").references(() => teamPools.id, {
      onDelete: "set null",
    }),
    randomMode: randomModeEnum("random_mode"),
    isRanked: boolean("is_ranked").default(true).notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("matches_played_at_idx").on(table.playedAt),
    index("matches_status_played_at_idx").on(table.status, table.playedAt),
    index("matches_tournament_idx").on(table.tournamentId),
    index("matches_ranked_mode_idx").on(table.isRanked, table.matchMode),
  ],
);

export const matchSides = pgTable(
  "match_sides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    side: matchSideEnum("side").notNull(),
    teamId: uuid("team_id").references(() => teams.id, {
      onDelete: "restrict",
    }),
    score: integer("score"),
    rerollCount: integer("reroll_count").default(0).notNull(),
  },
  (table) => [
    unique("match_sides_match_side_unique").on(table.matchId, table.side),
    unique("match_sides_id_match_unique").on(table.id, table.matchId),
    index("match_sides_match_idx").on(table.matchId),
    index("match_sides_team_idx").on(table.teamId),
    check(
      "match_sides_score_non_negative_check",
      sql`${table.score} is null or ${table.score} >= 0`,
    ),
    check(
      "match_sides_reroll_non_negative_check",
      sql`${table.rerollCount} >= 0`,
    ),
  ],
);

export const matchSidePlayers = pgTable(
  "match_side_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    matchSideId: uuid("match_side_id").notNull(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "match_side_players_side_match_fk",
      columns: [table.matchSideId, table.matchId],
      foreignColumns: [matchSides.id, matchSides.matchId],
    }).onDelete("cascade"),
    unique("match_side_players_match_player_unique").on(
      table.matchId,
      table.playerId,
    ),
    unique("match_side_players_side_position_unique").on(
      table.matchSideId,
      table.position,
    ),
    index("match_side_players_side_idx").on(table.matchSideId),
    index("match_side_players_player_idx").on(table.playerId),
    check(
      "match_side_players_position_positive_check",
      sql`${table.position} > 0`,
    ),
  ],
);

export const matchNotes = pgTable(
  "match_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("match_notes_match_player_unique").on(table.matchId, table.playerId),
    index("match_notes_match_idx").on(table.matchId),
  ],
);
