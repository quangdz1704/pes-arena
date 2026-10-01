ALTER TABLE "tournament_competitors" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "team_pool_id" uuid;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "is_home_and_away" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_competitors" ADD CONSTRAINT "tournament_competitors_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_team_pool_id_team_pools_id_fk" FOREIGN KEY ("team_pool_id") REFERENCES "public"."team_pools"("id") ON DELETE set null ON UPDATE no action;