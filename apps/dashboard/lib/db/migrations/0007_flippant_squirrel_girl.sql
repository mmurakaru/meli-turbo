CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "steps" RENAME COLUMN "tour_id" TO "module_id";--> statement-breakpoint
ALTER TABLE "steps" DROP CONSTRAINT "steps_tour_id_tours_id_fk";
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_module_id_tours_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;