import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../../../db';
import { drivers, camps, driverCampRoutes, scheduleShifts, backupAssignments } from '../../../db/schema';
import { Driver, CreateDriverDTO, UpdateDriverDTO, ScheduleShift, BackupAssignment, AssignBackupDTO } from '../types';

async function getOrCreateCampId(campName: string): Promise<number> {
  const trimmed = campName.trim();
  if (!trimmed) return 0;
  const existing = await getDb().select().from(camps).where(eq(camps.name, trimmed)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [inserted] = await getDb().insert(camps).values({ name: trimmed }).returning();
  return inserted.id;
}

async function saveCampRoutes(driverId: number, campStr: string, routesStr: string) {
  await getDb().delete(driverCampRoutes).where(eq(driverCampRoutes.driverId, driverId));

  const campArr = (campStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const routeArr = (routesStr || '').split(',').map(s => s.trim());

  for (let i = 0; i < campArr.length; i++) {
    const cName = campArr[i];
    const rName = routeArr[i] || '';
    if (!cName) continue;

    const campId = await getOrCreateCampId(cName);
    await getDb().insert(driverCampRoutes).values({
      driverId,
      campId,
      route: rName,
    });
  }
}

async function getDriverFull(driverRow: typeof drivers.$inferSelect): Promise<Driver> {
  const mappings = await getDb()
    .select({
      campId: driverCampRoutes.campId,
      campName: camps.name,
      route: driverCampRoutes.route,
    })
    .from(driverCampRoutes)
    .innerJoin(camps, eq(driverCampRoutes.campId, camps.id))
    .where(eq(driverCampRoutes.driverId, driverRow.id));

  const campNames = mappings.map((m: { campName: string }) => m.campName);
  const routes = mappings.map((m: { route: string }) => m.route);

  return {
    id: driverRow.id,
    driverCode: driverRow.driverCode || '',
    name: driverRow.name,
    phone: driverRow.phone,
    camp: campNames.join(','),
    routes: routes.join(','),
    contractType: driverRow.contractType as Driver['contractType'],
    createdAt: driverRow.createdAt.toISOString(),
    isDeleted: driverRow.isDeleted,
    campRoutes: mappings.map((m: { campId: number; campName: string; route: string }) => ({
      campId: m.campId,
      campName: m.campName,
      route: m.route,
    })),
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
    return Promise.all(filtered.map(getDriverFull));
  }

  public async findById(id: number): Promise<Driver | undefined> {
    const rows = await getDb().select().from(drivers).where(eq(drivers.id, id)).limit(1);
    const row = rows[0];
    if (!row || row.isDeleted) return undefined;
    return getDriverFull(row);
  }

  public async create(dto: CreateDriverDTO): Promise<Driver> {
    const [row] = await getDb()
      .insert(drivers)
      .values({
        driverCode: (dto.driverCode ?? '').trim(),
        name: dto.name,
        phone: dto.phone,
        contractType: dto.contractType,
        isDeleted: false,
      })
      .returning();

    await saveCampRoutes(row.id, dto.camp, dto.routes);
    return getDriverFull(row);
  }

  public async update(id: number, dto: UpdateDriverDTO): Promise<Driver | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const [row] = await getDb()
      .update(drivers)
      .set({
        driverCode: dto.driverCode !== undefined ? dto.driverCode.trim() : existing.driverCode,
        name: dto.name ?? existing.name,
        phone: dto.phone ?? existing.phone,
        contractType: dto.contractType ?? existing.contractType,
      })
      .where(eq(drivers.id, id))
      .returning();

    if (row && (dto.camp !== undefined || dto.routes !== undefined)) {
      const campStr = dto.camp !== undefined ? dto.camp : existing.camp;
      const routesStr = dto.routes !== undefined ? dto.routes : existing.routes;
      await saveCampRoutes(row.id, campStr, routesStr);
    }

    return row ? getDriverFull(row) : null;
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
