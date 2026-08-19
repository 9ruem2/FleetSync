import { boolean, integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const camps = pgTable('camps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  driverCode: text('driver_code').notNull().default(''),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  contractType: text('contract_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

export const driverCampRoutes = pgTable('driver_camp_routes', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  route: text('route').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const scheduleShifts = pgTable(
  'schedule_shifts',
  {
    id: serial('id').primaryKey(),
    driverId: integer('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    status: text('status').notNull(),
  },
  (table) => [unique('schedule_shifts_driver_date_unique').on(table.driverId, table.date)]
);

export const backupAssignments = pgTable('backup_assignments', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  routeNumber: text('route_number').notNull(),
  originalDriverId: integer('original_driver_id').notNull().references(() => drivers.id),
  originalDriverName: text('original_driver_name').notNull(),
  backupDriverId: integer('backup_driver_id').notNull().references(() => drivers.id),
  backupDriverName: text('backup_driver_name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CampRow = typeof camps.$inferSelect;
export type DriverRow = typeof drivers.$inferSelect;
export type DriverCampRouteRow = typeof driverCampRoutes.$inferSelect;
export type ScheduleShiftRow = typeof scheduleShifts.$inferSelect;
export type BackupAssignmentRow = typeof backupAssignments.$inferSelect;
