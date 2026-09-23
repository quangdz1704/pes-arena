CREATE TYPE "public"."discord_report_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."discord_report_type" AS ENUM('WEEKLY_LEADERBOARD', 'MANUAL_LEADERBOARD');--> statement-breakpoint
CREATE TYPE "public"."match_mode" AS ENUM('ONE_V_ONE', 'TWO_V_TWO');--> statement-breakpoint
CREATE TYPE "public"."match_side" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('CREATED', 'PLAYING', 'FINISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."random_mode" AS ENUM('PURE', 'BALANCED');--> statement-breakpoint
CREATE TYPE "public"."team_tier" AS ENUM('S', 'A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('CLUB', 'NATIONAL');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."tournament_type" AS ENUM('LEAGUE', 'KNOCKOUT');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" varchar(32) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"app_name" varchar(100) DEFAULT 'PES Arena' NOT NULL,
	"default_ranked" boolean DEFAULT true NOT NULL,
	"minimum_matches_for_winrate_ranking" integer DEFAULT 10 NOT NULL,
	"minimum_weekly_matches" integer DEFAULT 3 NOT NULL,
	"default_leaderboard_sort" varchar(32) DEFAULT 'WINS' NOT NULL,
	"tournament_win_points" integer DEFAULT 3 NOT NULL,
	"tournament_draw_points" integer DEFAULT 1 NOT NULL,
	"tournament_loss_points" integer DEFAULT 0 NOT NULL,
	"auto_weekly_report_enabled" boolean DEFAULT false NOT NULL,
	"weekly_report_day" integer DEFAULT 0 NOT NULL,
	"weekly_report_hour" integer DEFAULT 23 NOT NULL,
	"include_weekly_honors" boolean DEFAULT true NOT NULL,
	"include_weekly_shame" boolean DEFAULT true NOT NULL,
	"include_troll_caption" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"nickname" varchar(100),
	"avatar_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_pool_members" (
	"team_pool_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_pool_members_pk" PRIMARY KEY("team_pool_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "team_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"emoji" varchar(16),
	"description" varchar(300),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"short_name" varchar(12) NOT NULL,
	"logo_url" varchar(500),
	"type" "team_type" NOT NULL,
	"tier" "team_tier" NOT NULL,
	"country" varchar(100) NOT NULL,
	"rating" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_rating_range_check" CHECK ("teams"."rating" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "match_side_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"match_side_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_side_players_match_player_unique" UNIQUE("match_id","player_id"),
	CONSTRAINT "match_side_players_side_position_unique" UNIQUE("match_side_id","position"),
	CONSTRAINT "match_side_players_position_positive_check" CHECK ("match_side_players"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "match_sides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"side" "match_side" NOT NULL,
	"team_id" uuid,
	"score" integer,
	"reroll_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "match_sides_match_side_unique" UNIQUE("match_id","side"),
	CONSTRAINT "match_sides_id_match_unique" UNIQUE("id","match_id"),
	CONSTRAINT "match_sides_score_non_negative_check" CHECK ("match_sides"."score" is null or "match_sides"."score" >= 0),
	CONSTRAINT "match_sides_reroll_non_negative_check" CHECK ("match_sides"."reroll_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_mode" "match_mode" NOT NULL,
	"status" "match_status" DEFAULT 'CREATED' NOT NULL,
	"tournament_id" uuid,
	"team_pool_id" uuid,
	"random_mode" "random_mode",
	"is_ranked" boolean DEFAULT true NOT NULL,
	"played_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "discord_report_type" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" "discord_report_status" DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discord_reports_period_unique" UNIQUE("type","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "tournament_competitor_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competitor_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_competitor_player_unique" UNIQUE("competitor_id","player_id"),
	CONSTRAINT "tournament_competitor_position_unique" UNIQUE("competitor_id","position")
);
--> statement-breakpoint
CREATE TABLE "tournament_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"seed" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_competitors_name_unique" UNIQUE("tournament_id","display_name")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" "tournament_type" DEFAULT 'LEAGUE' NOT NULL,
	"match_mode" "match_mode" NOT NULL,
	"status" "tournament_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_pool_members" ADD CONSTRAINT "team_pool_members_team_pool_id_team_pools_id_fk" FOREIGN KEY ("team_pool_id") REFERENCES "public"."team_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_pool_members" ADD CONSTRAINT "team_pool_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_side_players" ADD CONSTRAINT "match_side_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_side_players" ADD CONSTRAINT "match_side_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_side_players" ADD CONSTRAINT "match_side_players_side_match_fk" FOREIGN KEY ("match_side_id","match_id") REFERENCES "public"."match_sides"("id","match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sides" ADD CONSTRAINT "match_sides_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sides" ADD CONSTRAINT "match_sides_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_pool_id_team_pools_id_fk" FOREIGN KEY ("team_pool_id") REFERENCES "public"."team_pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_competitor_players" ADD CONSTRAINT "tournament_competitor_players_competitor_id_tournament_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."tournament_competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_competitor_players" ADD CONSTRAINT "tournament_competitor_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_competitors" ADD CONSTRAINT "tournament_competitors_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_name_unique" ON "players" USING btree ("name");--> statement-breakpoint
CREATE INDEX "players_active_idx" ON "players" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "team_pool_members_team_idx" ON "team_pool_members" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_pools_name_unique" ON "team_pools" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_name_unique" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "teams_type_tier_active_idx" ON "teams" USING btree ("type","tier","is_active");--> statement-breakpoint
CREATE INDEX "match_side_players_side_idx" ON "match_side_players" USING btree ("match_side_id");--> statement-breakpoint
CREATE INDEX "match_side_players_player_idx" ON "match_side_players" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "match_sides_match_idx" ON "match_sides" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_sides_team_idx" ON "match_sides" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "matches_status_played_at_idx" ON "matches" USING btree ("status","played_at");--> statement-breakpoint
CREATE INDEX "matches_tournament_idx" ON "matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "matches_ranked_mode_idx" ON "matches" USING btree ("is_ranked","match_mode");--> statement-breakpoint
CREATE INDEX "discord_reports_status_idx" ON "discord_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tournament_competitor_players_player_idx" ON "tournament_competitor_players" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "tournament_competitors_tournament_idx" ON "tournament_competitors" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournaments_status_idx" ON "tournaments" USING btree ("status");