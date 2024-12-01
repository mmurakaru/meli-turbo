CREATE TABLE IF NOT EXISTS "tours" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" varchar(36) NOT NULL,
	"team_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"steps" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tours_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tours" ADD CONSTRAINT "tours_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
