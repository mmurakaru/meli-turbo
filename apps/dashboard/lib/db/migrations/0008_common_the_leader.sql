ALTER TABLE "steps" DROP CONSTRAINT "steps_module_id_tours_id_fk";
--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;