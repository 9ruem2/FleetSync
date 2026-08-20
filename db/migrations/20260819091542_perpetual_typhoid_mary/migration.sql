CREATE TABLE "backup_assignments" (
	"id" serial PRIMARY KEY,
	"date" text NOT NULL,
	"route_number" text NOT NULL,
	"original_driver_id" integer NOT NULL,
	"original_driver_name" text NOT NULL,
	"backup_driver_id" integer NOT NULL,
	"backup_driver_name" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY,
	"driver_code" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"route_number" text DEFAULT '' NOT NULL,
	"routes_week13" text DEFAULT '' NOT NULL,
	"routes_week24" text DEFAULT '' NOT NULL,
	"week_pattern" text DEFAULT '1,3' NOT NULL,
	"contract_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_shifts" (
	"id" serial PRIMARY KEY,
	"driver_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "schedule_shifts_driver_date_unique" UNIQUE("driver_id","date")
);
--> statement-breakpoint
ALTER TABLE "backup_assignments" ADD CONSTRAINT "backup_assignments_original_driver_id_drivers_id_fkey" FOREIGN KEY ("original_driver_id") REFERENCES "drivers"("id");--> statement-breakpoint
ALTER TABLE "backup_assignments" ADD CONSTRAINT "backup_assignments_backup_driver_id_drivers_id_fkey" FOREIGN KEY ("backup_driver_id") REFERENCES "drivers"("id");--> statement-breakpoint
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_driver_id_drivers_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id");