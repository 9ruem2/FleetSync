import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../../../db';
import { drivers, scheduleShifts, backupAssignments } from '../../../db/schema';
import { Driver, CreateDriverDTO, UpdateDriverDTO, ScheduleShift, BackupAssignment, AssignBackupDTO } from '../types';
import { derivePrimaryRoute, normalizeWeekPattern } from '../utils/routeUtils';

function toDriver(row: typeof drivers.$inferSelect): Driver {
  return {
    id: row.id,
    driverCode: row.driverCode || '',
    name: row.name,
    phone: row.phone,
    camp: row.camp || '',
    routeNumber: row.routeNumber,
    routesWeek13: row.routesWeek13,
    routesWeek24: row.routesWeek24,
    weekPattern: normalizeWeekPattern(row.weekPattern),
    contractType: row.contractType as Driver['contractType'],
    createdAt: row.createdAt.toISOString(),
    isDeleted: row.isDeleted,
  };
}

function toShift(row: typeof scheduleShifts.$inferSelect): ScheduleShift {
  return {
    id: row.id,
    driverId: row.driverId,
    date: row.date,
    status: row.status as ScheduleShift['status'],
  };
}

function toBackup(row: typeof backupAssignments.$inferSelect): BackupAssignment {
  return {
    id: row.id,
    date: row.date,
    routeNumber: row.routeNumber,
    originalDriverId: row.originalDriverId,
    originalDriverName: row.originalDriverName,
    backupDriverId: row.backupDriverId,
    backupDriverName: row.backupDriverName,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

class DriverRepository {
  public async findAll(includeDeleted = false): Promise<Driver[]> {
    const rows = await getDb().select().from(drivers);
    const filtered = includeDeleted ? rows : rows.filter((d: typeof drivers.$inferSelect) => !d.isDeleted);
    return filtered.map(toDriver);
  }

  public async findById(id: number): Promise<Driver | undefined> {
    const rows = await getDb().select().from(drivers).where(eq(drivers.id, id)).limit(1);
    const row = rows[0];
    if (!row || row.isDeleted) return undefined;
    return toDriver(row);
  }

  public async create(dto: CreateDriverDTO): Promise<Driver> {
    const routeNumber = derivePrimaryRoute(dto);
    const [row] = await getDb()
      .insert(drivers)
      .values({
        driverCode: (dto.driverCode ?? '').trim(),
        name: dto.name,
        phone: dto.phone,
        camp: (dto.camp ?? '').trim(),
        routeNumber,
        routesWeek13: dto.routesWeek13,
        routesWeek24: dto.routesWeek24,
        weekPattern: dto.weekPattern,
        contractType: dto.contractType,
        isDeleted: false,
      })
      .returning();
    return toDriver(row);
  }

  public async update(id: number, dto: UpdateDriverDTO): Promise<Driver | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = {
      routesWeek13: dto.routesWeek13 ?? existing.routesWeek13,
      routesWeek24: dto.routesWeek24 ?? existing.routesWeek24,
      weekPattern: dto.weekPattern ?? existing.weekPattern,
    };
    const routeNumber = derivePrimaryRoute(merged);

    const [row] = await getDb()
      .update(drivers)
      .set({
        driverCode: dto.driverCode !== undefined ? dto.driverCode.trim() : existing.driverCode,
        name: dto.name ?? existing.name,
        phone: dto.phone ?? existing.phone,
        camp: dto.camp !== undefined ? dto.camp.trim() : existing.camp,
        routeNumber,
        routesWeek13: merged.routesWeek13,
        routesWeek24: merged.routesWeek24,
        weekPattern: merged.weekPattern,
        contractType: dto.contractType ?? existing.contractType,
      })
      .where(eq(drivers.id, id))
      .returning();

    return row ? toDriver(row) : null;
  }

  public async softDelete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await getDb().update(drivers).set({ isDeleted: true }).where(eq(drivers.id, id));
    return true;
  }
}

class ScheduleRepository {
  public async findShifts(startDate?: string, endDate?: string, driverId?: number): Promise<ScheduleShift[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(scheduleShifts.date, startDate));
    if (endDate) conditions.push(lte(scheduleShifts.date, endDate));
    if (driverId !== undefined) conditions.push(eq(scheduleShifts.driverId, driverId));

    const rows = conditions.length > 0
      ? await getDb().select().from(scheduleShifts).where(and(...conditions))
      : await getDb().select().from(scheduleShifts);

    return rows.map(toShift);
  }

  public async findShift(driverId: number, date: string): Promise<ScheduleShift | undefined> {
    const rows = await getDb()
      .select()
      .from(scheduleShifts)
      .where(and(eq(scheduleShifts.driverId, driverId), eq(scheduleShifts.date, date)))
      .limit(1);
    return rows[0] ? toShift(rows[0]) : undefined;
  }

  public async upsertShift(driverId: number, date: string, status: ScheduleShift['status']): Promise<ScheduleShift> {
    const existing = await this.findShift(driverId, date);

    if (existing) {
      const [row] = await getDb()
        .update(scheduleShifts)
        .set({ status })
        .where(eq(scheduleShifts.id, existing.id))
        .returning();
      return toShift(row);
    }

    const [row] = await getDb()
      .insert(scheduleShifts)
      .values({ driverId, date, status })
      .returning();
    return toShift(row);
  }

  public async getOffDays(startDate?: string, endDate?: string): Promise<ScheduleShift[]> {
    const conditions = [eq(scheduleShifts.status, '휴무')];
    if (startDate) conditions.push(gte(scheduleShifts.date, startDate));
    if (endDate) conditions.push(lte(scheduleShifts.date, endDate));

    const rows = await getDb().select().from(scheduleShifts).where(and(...conditions));
    return rows.map(toShift);
  }
}

class BackupRepository {
  public async findAll(): Promise<BackupAssignment[]> {
    const rows = await getDb().select().from(backupAssignments);
    return rows.map(toBackup);
  }

  public async findByDateAndRoute(date: string, routeNumber: string): Promise<BackupAssignment | undefined> {
    const rows = await getDb()
      .select()
      .from(backupAssignments)
      .where(and(eq(backupAssignments.date, date), eq(backupAssignments.routeNumber, routeNumber)))
      .limit(1);
    return rows[0] ? toBackup(rows[0]) : undefined;
  }

  public async findByDate(date: string): Promise<BackupAssignment[]> {
    const rows = await getDb()
      .select()
      .from(backupAssignments)
      .where(eq(backupAssignments.date, date));
    return rows.map(toBackup);
  }

  public async assignBackup(dto: AssignBackupDTO): Promise<BackupAssignment | null> {
    const originalDriver = await driverRepository.findById(dto.originalDriverId);
    const backupDriver = await driverRepository.findById(dto.backupDriverId);

    if (!originalDriver || !backupDriver) return null;

    await getDb()
      .delete(backupAssignments)
      .where(
        and(
          eq(backupAssignments.date, dto.date),
          eq(backupAssignments.routeNumber, dto.routeNumber)
        )
      );

    const [row] = await getDb()
      .insert(backupAssignments)
      .values({
        date: dto.date,
        routeNumber: dto.routeNumber,
        originalDriverId: originalDriver.id,
        originalDriverName: originalDriver.name,
        backupDriverId: backupDriver.id,
        backupDriverName: backupDriver.name,
        note: dto.note || '수동 지정 완료',
      })
      .returning();

    return toBackup(row);
  }

  public async removeAssignment(date: string, routeNumber: string): Promise<boolean> {
    const existing = await this.findByDateAndRoute(date, routeNumber);
    if (!existing) return false;

    await getDb()
      .delete(backupAssignments)
      .where(
        and(
          eq(backupAssignments.date, date),
          eq(backupAssignments.routeNumber, routeNumber)
        )
      );
    return true;
  }
}

export const driverRepository = new DriverRepository();
export const scheduleRepository = new ScheduleRepository();
export const backupRepository = new BackupRepository();
