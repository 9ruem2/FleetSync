import { boolean, integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  companyCode: text('company_code').notNull().unique(),
  masterAdminIds: text('master_admin_ids'), // 쉼표로 구분된 총괄관리자 아이디 목록
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    loginId: text('login_id').notNull(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    isMaster: boolean('is_master').notNull().default(false), // 총괄관리자 여부
    isAllCampsAccessible: boolean('is_all_camps_accessible').notNull().default(true),
    canCreate: boolean('can_create').notNull().default(true),
    canRead: boolean('can_read').notNull().default(true),
    canUpdate: boolean('can_update').notNull().default(true),
    canDelete: boolean('can_delete').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('company_admin_login_unique').on(table.companyId, table.loginId)]
);

export const adminCamps = pgTable(
  'admin_camps',
  {
    id: serial('id').primaryKey(),
    adminId: integer('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
    campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('admin_camp_unique').on(table.adminId, table.campId)]
);

export const adminCampRoutes = pgTable(
  'admin_camp_routes',
  {
    id: serial('id').primaryKey(),
    adminId: integer('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
    campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
    routeId: integer('route_id').references(() => routes.id, { onDelete: 'cascade' }),
    routeName: text('route_name').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const camps = pgTable('camps', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('company_camp_name_unique').on(table.companyId, table.name)]);

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('camp_route_name_unique').on(table.campId, table.name)]);

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
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
  routeId: integer('route_id').references(() => routes.id, { onDelete: 'set null' }),
  routeName: text('route_name').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const driverFixedHolidays = pgTable('driver_fixed_holidays', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  weekCycle: text('week_cycle').notNull(), // '매주' | '1,3주' | '2,4주' | '1주' | '2주' | '3주' | '4주' | '5주'
  dayOfWeek: text('day_of_week').notNull(), // '월' | '화' | '수' | '목' | '금' | '토' | '일'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const driverRoutePatterns = pgTable('driver_route_patterns', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  weekCycle: text('week_cycle').notNull(), // '매주' | '1,3주' | '2,4주' | '1주'~'5주'
  dayOfWeek: text('day_of_week').notNull(), // '월,화' 등
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'set null' }),
  campName: text('camp_name').notNull().default(''),
  routeId: integer('route_id').references(() => routes.id, { onDelete: 'set null' }),
  routeName: text('route_name').notNull().default(''),
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
  campName: text('camp_name'),
  routeNumber: text('route_number').notNull(),
  originalDriverId: integer('original_driver_id').notNull().references(() => drivers.id),
  originalDriverName: text('original_driver_name').notNull(),
  backupDriverId: integer('backup_driver_id').notNull().references(() => drivers.id),
  backupDriverName: text('backup_driver_name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CompanyRow = typeof companies.$inferSelect;
export type AdminRow = typeof admins.$inferSelect;
export type AdminCampRow = typeof adminCamps.$inferSelect;
export type CampRow = typeof camps.$inferSelect;
export type RouteRow = typeof routes.$inferSelect;
export type DriverRow = typeof drivers.$inferSelect;
export type DriverCampRouteRow = typeof driverCampRoutes.$inferSelect;
export type DriverFixedHolidayRow = typeof driverFixedHolidays.$inferSelect;
export type DriverRoutePatternRow = typeof driverRoutePatterns.$inferSelect;
export type ScheduleShiftRow = typeof scheduleShifts.$inferSelect;
export type BackupAssignmentRow = typeof backupAssignments.$inferSelect;

