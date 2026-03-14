ALTER TABLE "tours" RENAME TO "documents";--> statement-breakpoint
ALTER TABLE "modules" DROP CONSTRAINT "modules_tour_id_tours_id_fk";--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_tour_id_documents_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
