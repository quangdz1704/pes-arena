import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { players, teamPools, teams } from "./core";
import { matches } from "./matches";
import {
  matchModeEnum,
  tournamentStatusEnum,
  tournamentTypeEnum,
} from "./enums";

export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    type: tournamentTypeEnum("type").default("LEAGUE").notNull(),
    matchMode: matchModeEnum("match_mode").notNull(),
    teamPoolId: uuid("team_pool_id").references(() => teamPools.id, {
      onDelete: "set null",
    }),
    isHomeAndAway: boolean("is_home_and_away").default(false).notNull(),
    status: tournamentStatusEnum("status").default("DRAFT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("tournaments_status_idx").on(table.status)],
);

export const tournamentCompetitors = pgTable(
  "tournament_competitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "restrict" }),
    seed: integer("seed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tournament_competitors_tournament_idx").on(table.tournamentId),
    unique("tournament_competitors_name_unique").on(
      table.tournamentId,
      table.displayName,
    ),
  ],
);

export const tournamentCompetitorPlayers = pgTable(
  "tournament_competitor_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitorId: uuid("competitor_id")
      .notNull()
      .references(() => tournamentCompetitors.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("tournament_competitor_player_unique").on(
      table.competitorId,
      table.playerId,
    ),
    unique("tournament_competitor_position_unique").on(
      table.competitorId,
      table.position,
    ),
    index("tournament_competitor_players_player_idx").on(table.playerId),
  ],
);

export const tournamentFixtures = pgTable(
  "tournament_fixtures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    position: integer("position").default(0).notNull(),
    homeCompetitorId: uuid("home_competitor_id").notNull(),
    awayCompetitorId: uuid("away_competitor_id").notNull(),
    matchId: uuid("match_id").references(() => matches.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "tournament_fixtures_home_competitor_fk",
      columns: [table.homeCompetitorId],
      foreignColumns: [tournamentCompetitors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "tournament_fixtures_away_competitor_fk",
      columns: [table.awayCompetitorId],
      foreignColumns: [tournamentCompetitors.id],
    }).onDelete("cascade"),
    unique("tournament_fixtures_round_pair_unique").on(
      table.tournamentId,
      table.round,
      table.homeCompetitorId,
      table.awayCompetitorId,
    ),
    index("tournament_fixtures_tournament_round_idx").on(
      table.tournamentId,
      table.round,
    ),
  ],
);

// Separate from fixtures so teams can be reserved for future knockout rounds.
export const tournamentFixtureTeams = pgTable(
  "tournament_fixture_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    position: integer("position").notNull(),
    homeTeamId: uuid("home_team_id").notNull().references(() => teams.id, { onDelete: "restrict" }),
    awayTeamId: uuid("away_team_id").notNull().references(() => teams.id, { onDelete: "restrict" }),
  },
  (table) => [unique("tournament_fixture_teams_slot_unique").on(table.tournamentId, table.round, table.position)],
);
