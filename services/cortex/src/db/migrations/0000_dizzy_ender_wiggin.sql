CREATE SCHEMA "post";
--> statement-breakpoint
CREATE SCHEMA "user";
--> statement-breakpoint
CREATE TABLE "post"."post" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"title" varchar(256) NOT NULL,
	"content" varchar,
	"published" boolean DEFAULT false,
	"author_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bio" varchar,
	"age" integer,
	"email" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user"."user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"age" integer,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE INDEX "author_id_idx" ON "post"."post" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_email_unique" ON "user"."profile" USING btree ("email");--> statement-breakpoint
CREATE INDEX "profile_user_id_idx" ON "user"."profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user"."user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user"."user" USING btree ("name");