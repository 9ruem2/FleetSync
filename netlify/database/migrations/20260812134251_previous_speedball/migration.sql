CREATE TABLE "backup_assignments" (
	"id" text PRIMARY KEY,
	"date" text NOT NULL,
	"route_number" text NOT NULL,
	"original_driver_id" text NOT NULL,
	"original_driver_name" text NOT NULL,
	"backup_driver_id" text NOT NULL,
	"backup_driver_name" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"route_number" text NOT NULL,
	"contract_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_shifts" (
	"id" text PRIMARY KEY,
	"driver_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_driver_id_drivers_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id");