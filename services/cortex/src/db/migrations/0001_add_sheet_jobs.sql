CREATE SCHEMA "sheet";
--> statement-breakpoint
CREATE TABLE "sheet"."sheet_jobs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"status" varchar(20) NOT NULL,
	"prompt" text NOT NULL,
	"source_url" varchar,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
