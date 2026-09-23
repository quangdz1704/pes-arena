CREATE TABLE "tournament_fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"home_competitor_id" uuid NOT NULL,
	"away_competitor_id" uuid NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_fixtures_round_pair_unique" UNIQUE("tournament_id","round","home_competitor_id","away_competitor_id")
);
--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_home_competitor_fk" FOREIGN KEY ("home_competitor_id") REFERENCES "public"."tournament_competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_away_competitor_fk" FOREIGN KEY ("away_competitor_id") REFERENCES "public"."tournament_competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_fixtures_tournament_round_idx" ON "tournament_fixtures" USING btree ("tournament_id","round");