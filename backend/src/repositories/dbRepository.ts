import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../../../db';
import { drivers, companies, camps, routes as routesTable, driverCampRoutes, scheduleShifts, backupAssignments } from '../../../db/schema';
import { Company, Camp, Route, Driver, CreateDriverDTO, UpdateDriverDTO, ScheduleShift, BackupAssignment, AssignBackupDTO } from '../types';

import { INITIAL_COMPANIES, DEFAULT_COMPANY_NAME } from '../constants/company';

// ==========================================
// Master Data Repositories (Company / Camp / Route)
// ==========================================

class MasterRepository {
  // Companies (개발자 상수로 등록된 회사들 자동 보장)
  public async findAllCompanies(): Promise<Company[]> {
    for (const comp of INITIAL_COMPANIES) {
      const existing = await getDb().select().from(companies).where(eq(companies.name, comp.name)).limit(1);
      if (existing.length === 0) {
        await getDb().insert(companies).values({ name: comp.name });
      }
    }
    const rows = await getDb().select().from(companies);
    return rows.map((r: typeof companies.$inferSelect) => ({ id: r.id, name: r.name, createdAt: r.createdAt.toISOString() }));
  }

  public async createCompany(name: string): Promise<Company> {
    const trimmed = name.trim();
    const existing = await getDb().select().from(companies).where(eq(companies.name, trimmed)).limit(1);
    if (existing.length > 0) {
      return { id: existing[0].id, name: existing[0].name, createdAt: existing[0].createdAt.toISOString() };
    }
    const [inserted] = await getDb().insert(companies).values({ name: trimmed }).returning();
    return { id: inserted.id, name: inserted.name, createdAt: inserted.createdAt.toISOString() };
  }

  public async deleteCompany(id: number): Promise<boolean> {
    await getDb().delete(companies).where(eq(companies.id, id));
    return true;
  }

  // Camps
  public async findCampsByCompany(companyId: number): Promise<Camp[]> {
    const rows = await getDb().select().from(camps).where(eq(camps.companyId, companyId));
    return rows.map((r: typeof camps.$inferSelect) => ({ id: r.id, companyId: r.companyId, name: r.name, createdAt: r.createdAt.toISOString() }));
  }

  public async createCamp(companyId: number, name: string): Promise<Camp> {
    const trimmed = name.trim();
    const existing = await getDb().select().from(camps).where(and(eq(camps.companyId, companyId), eq(camps.name, trimmed))).limit(1);
    if (existing.length > 0) {
      return { id: existing[0].id, companyId: existing[0].companyId, name: existing[0].name, createdAt: existing[0].createdAt.toISOString() };
    }
    const [inserted] = await getDb().insert(camps).values({ companyId, name: trimmed }).returning();
    return { id: inserted.id, companyId: inserted.companyId, name: inserted.name, createdAt: inserted.createdAt.toISOString() };
  }

  public async deleteCamp(id: number): Promise<boolean> {
    await getDb().delete(camps).where(eq(camps.id, id));
    return true;
  }

  // Routes
  public async findRoutesByCamp(campId: number): Promise<Route[]> {
    const rows = await getDb().select().from(routesTable).where(eq(routesTable.campId, campId));
    return rows.map((r: typeof routesTable.$inferSelect) => ({ id: r.id, campId: r.campId, name: r.name, createdAt: r.createdAt.toISOString() }));
  }

  public async createRoute(campId: number, name: string): Promise<Route> {
    const trimmed = name.trim();
    const existing = await getDb().select().from(routesTable).where(and(eq(routesTable.campId, campId), eq(routesTable.name, trimmed))).limit(1);
    if (existing.length > 0) {
      return { id: existing[0].id, campId: existing[0].campId, name: existing[0].name, createdAt: existing[0].createdAt.toISOString() };
    }
    const [inserted] = await getDb().insert(routesTable).values({ campId, name: trimmed }).returning();
    return { id: inserted.id, campId: inserted.campId, name: inserted.name, createdAt: inserted.createdAt.toISOString() };
  }

  public async deleteRoute(id: number): Promise<boolean> {
    await getDb().delete(routesTable).where(eq(routesTable.id, id));
    return true;
  }
}

// 헬퍼: 캠프명이 들어오면 기본 회사를 지정하거나 찾기
async function getOrCreateCampId(campName: string, companyId?: number): Promise<number> {
  const trimmed = campName.trim();
  if (!trimmed) return 0;

  let targetCompanyId: number;
  if (companyId) {
    targetCompanyId = companyId;
  } else {
    // 기본 회사 가져오거나 생성 ('대국')
    const daegukCompanies = await getDb().select().from(companies).where(eq(companies.name, DEFAULT_COMPANY_NAME)).limit(1);
    if (daegukCompanies.length > 0) {
      targetCompanyId = daegukCompanies[0].id;
    } else {
      const [newComp] = await getDb().insert(companies).values({ name: DEFAULT_COMPANY_NAME }).returning();
      targetCompanyId = newComp.id;
    }
  }

  const existing = await getDb().select().from(camps).where(and(eq(camps.companyId, targetCompanyId), eq(camps.name, trimmed))).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [inserted] = await getDb().insert(camps).values({ companyId: targetCompanyId, name: trimmed }).returning();
  return inserted.id;
}

async function saveCampRoutes(driverId: number, campStr: string, routesStr: string, companyId?: number) {
  await getDb().delete(driverCampRoutes).where(eq(driverCampRoutes.driverId, driverId));

  const campArr = (campStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const routeArr = (routesStr || '').split(',').map(s => s.trim());

  for (let i = 0; i < campArr.length; i++) {
    const cName = campArr[i];
    const rName = routeArr[i] || '';
    if (!cName) continue;

    const campId = await getOrCreateCampId(cName, companyId);
    
    // 라우트 마스터에 존재 유무 체크 후 생성
    if (rName.trim()) {
      const existingRoute = await getDb().select().from(routesTable).where(and(eq(routesTable.campId, campId), eq(routesTable.name, rName.trim()))).limit(1);
      let routeId: number;
      if (existingRoute.length > 0) {
        routeId = existingRoute[0].id;
      } else {
        const [insertedRoute] = await getDb().insert(routesTable).values({ campId, name: rName.trim() }).returning();
        routeId = insertedRoute.id;
      }

      await getDb().insert(driverCampRoutes).values({
        driverId,
        campId,
        routeId,
        routeName: rName.trim(),
      });
    } else {
      await getDb().insert(driverCampRoutes).values({
        driverId,
        campId,
        routeName: '',
      });
    }
  }
}

async function getDriverFull(driverRow: typeof drivers.$inferSelect): Promise<Driver> {
  const mappings = await getDb()
    .select({
      campId: driverCampRoutes.campId,
      campName: camps.name,
      routeId: driverCampRoutes.routeId,
      route: driverCampRoutes.routeName,
    })
    .from(driverCampRoutes)
    .innerJoin(camps, eq(driverCampRoutes.campId, camps.id))
    .where(eq(driverCampRoutes.driverId, driverRow.id));

  const campNames = mappings.map((m: { campName: string }) => m.campName);
  const routes = mappings.map((m: { route: string }) => m.route);

  let companyName = '';
  if (driverRow.companyId) {
    const compRows = await getDb().select().from(companies).where(eq(companies.id, driverRow.companyId)).limit(1);
    if (compRows.length > 0) companyName = compRows[0].name;
  }

  return {
    id: driverRow.id,
    companyId: driverRow.companyId ?? undefined,
    companyName,
    driverCode: driverRow.driverCode || '',
    name: driverRow.name,
    phone: driverRow.phone,
    camp: campNames.join(','),
    routes: routes.join(','),
    contractType: driverRow.contractType as Driver['contractType'],
    createdAt: driverRow.createdAt.toISOString(),
    isDeleted: driverRow.isDeleted,
    campRoutes: mappings.map((m: { campId: number; campName: string; routeId: number | null; route: string }) => ({
      campId: m.campId,
      campName: m.campName,
      routeId: m.routeId ?? undefined,
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
        companyId: dto.companyId,
        driverCode: (dto.driverCode ?? '').trim(),
        name: dto.name,
        phone: dto.phone,
        contractType: dto.contractType,
        isDeleted: false,
      })
      .returning();

    await saveCampRoutes(row.id, dto.camp, dto.routes, dto.companyId);
    return getDriverFull(row);
  }

  public async update(id: number, dto: UpdateDriverDTO): Promise<Driver | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const [row] = await getDb()
      .update(drivers)
      .set({
        companyId: dto.companyId !== undefined ? dto.companyId : existing.companyId,
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
      await saveCampRoutes(row.id, campStr, routesStr, dto.companyId ?? existing.companyId);
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

export const masterRepository = new MasterRepository();
export const driverRepository = new DriverRepository();
export const scheduleRepository = new ScheduleRepository();
export const backupRepository = new BackupRepository();
