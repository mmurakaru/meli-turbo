CREATE TYPE "public"."owner_type" AS ENUM('team', 'user');--> statement-breakpoint

ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "steps" DROP CONSTRAINT "steps_tour_id_tours_id_fk";
--> statement-breakpoint
ALTER TABLE "tours" DROP CONSTRAINT "tours_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_team_id_teams_id_fk";
--> statement-breakpoint

-- Change team_id column in activity_logs to CHAR then to UUID
ALTER TABLE "activity_logs" ALTER COLUMN "team_id" SET DATA TYPE CHAR USING team_id::CHAR;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "team_id" SET DATA TYPE uuid USING team_id::uuid;--> statement-breakpoint

-- Change team_id column in invitations to CHAR then to UUID
ALTER TABLE "invitations" ALTER COLUMN "team_id" SET DATA TYPE CHAR USING team_id::CHAR;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "team_id" SET DATA TYPE uuid USING team_id::uuid;--> statement-breakpoint

-- Change team_id column in team_members to CHAR then to UUID
ALTER TABLE "team_members" ALTER COLUMN "team_id" SET DATA TYPE CHAR USING team_id::CHAR;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "team_id" SET DATA TYPE uuid USING team_id::uuid;--> statement-breakpoint

-- Change team_id column in teams to CHAR then to UUID
ALTER TABLE "teams" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DATA TYPE CHAR USING id::CHAR;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();--> statement-breakpoint

ALTER TABLE "tours" ADD COLUMN "owner_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "owner_type" "owner_type" NOT NULL;--> statement-breakpoint


DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint


DO $$ BEGIN
 ALTER TABLE "steps" ADD CONSTRAINT "steps_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE "tours" DROP COLUMN IF EXISTS "team_id";--> statement-breakpoint