CREATE TABLE IF NOT EXISTS "drivers" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "route_number" text NOT NULL,
  "contract_type" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "schedule_shifts" (
  "id" text PRIMARY KEY NOT NULL,
  "driver_id" text NOT NULL REFERENCES "drivers"("id"),
  "date" text NOT NULL,
  "status" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "backup_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "route_number" text NOT NULL,
  "original_driver_id" text NOT NULL,
  "original_driver_name" text NOT NULL,
  "backup_driver_id" text NOT NULL,
  "backup_driver_name" text NOT NULL,
  "note" text,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_schedule_shifts_driver_date" ON "schedule_shifts" ("driver_id", "date");
CREATE INDEX IF NOT EXISTS "idx_schedule_shifts_date" ON "schedule_shifts" ("date");
CREATE INDEX IF NOT EXISTS "idx_backup_assignments_date" ON "backup_assignments" ("date");
