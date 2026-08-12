import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const drivers = pgTable('drivers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  routeNumber: text('route_number').notNull(),
  contractType: text('contract_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

export const scheduleShifts = pgTable('schedule_shifts', {
  id: text('id').primaryKey(),
  driverId: text('driver_id').notNull().references(() => drivers.id),
  date: text('date').notNull(),
  status: text('status').notNull(),
});

export const backupAssignments = pgTable('backup_assignments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  routeNumber: text('route_number').notNull(),
  originalDriverId: text('original_driver_id').notNull(),
  originalDriverName: text('original_driver_name').notNull(),
  backupDriverId: text('backup_driver_id').notNull(),
  backupDriverName: text('backup_driver_name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export type DriverRow = typeof drivers.$inferSelect;
export type ScheduleShiftRow = typeof scheduleShifts.$inferSelect;
export type BackupAssignmentRow = typeof backupAssignments.$inferSelect;
