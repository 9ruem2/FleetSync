import { getDb } from '../../../db';
import { Company, Camp, Route, Driver, CreateDriverDTO, UpdateDriverDTO, ScheduleShift, BackupAssignment, AssignBackupDTO } from '../types';
import { DEFAULT_COMPANY_NAME } from '../constants/company';

// ==========================================
// Master Data Repositories (Company / Camp / Route)
// ==========================================

class MasterRepository {
  // 헬퍼: DB에 '대국' 회사가 존재하는지 보장하고 실제 DB ID 리턴
  private async getValidCompanyId(inputCompanyId?: number): Promise<number> {
    try {
      const sb = getDb();
      const { data: allComp, error } = await sb.from('companies').select('*');
      if (error) throw error;

      const rows = (allComp || []) as { id: number; name: string; created_at: string }[];

      if (inputCompanyId && typeof inputCompanyId === 'number' && !isNaN(inputCompanyId)) {
        const found = rows.find(c => c.id === inputCompanyId);
        if (found) return found.id;
      }

      const daeguk = rows.find(c => c.name === DEFAULT_COMPANY_NAME);
      if (daeguk) return daeguk.id;

      // 없으면 '대국' 회사 삽입
      const { data: inserted, error: insertErr } = await sb
        .from('companies')
        .insert({ name: DEFAULT_COMPANY_NAME })
        .select()
        .single();
      if (insertErr) throw insertErr;
      return (inserted as { id: number }).id;
    } catch (err) {
      console.error('[getValidCompanyId] error:', err);
      return 1;
    }
  }

  public async findAllCompanies(): Promise<Company[]> {
    try {
      await this.getValidCompanyId();
      const { data, error } = await getDb().from('companies').select('*').order('id');
      if (error) throw error;
      const rows = (data || []) as { id: number; name: string; user_id: string | null; created_at: string }[];
      if (rows.length > 0) {
        return rows.map(r => ({ id: r.id, name: r.name, userId: r.user_id ?? undefined, createdAt: r.created_at }));
      }
    } catch (err) {
      console.error('[findAllCompanies] error:', err);
    }
    return [{ id: 1, name: DEFAULT_COMPANY_NAME, createdAt: new Date().toISOString() }];
  }

  public async findCompanyByCredentials(userId: string, password: string): Promise<{ id: number; name: string } | null> {
    try {
      const { data, error } = await getDb()
        .from('companies')
        .select('id, name, user_id, password')
        .eq('user_id', userId.trim())
        .eq('password', password)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as { id: number; name: string; user_id: string; password: string };
      return { id: row.id, name: row.name };
    } catch (err) {
      console.error('[findCompanyByCredentials] error:', err);
      return null;
    }
  }

  public async createCompany(name: string): Promise<Company> {
    const trimmed = name.trim();
    const { data: existing } = await getDb().from('companies').select('*').eq('name', trimmed).single();
    if (existing) {
      const row = existing as { id: number; name: string; created_at: string };
      return { id: row.id, name: row.name, createdAt: row.created_at };
    }
    const { data, error } = await getDb().from('companies').insert({ name: trimmed }).select().single();
    if (error) throw error;
    const row = data as { id: number; name: string; created_at: string };
    return { id: row.id, name: row.name, createdAt: row.created_at };
  }

  public async deleteCompany(id: number): Promise<boolean> {
    try {
      const { error } = await getDb().from('companies').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[deleteCompany] error:', err);
    }
    return true;
  }

  // Camps
  public async findCampsByCompany(companyId: number): Promise<Camp[]> {
    try {
      const validCompanyId = await this.getValidCompanyId(companyId);
      const { data, error } = await getDb()
        .from('camps')
        .select('*')
        .eq('company_id', validCompanyId)
        .order('name', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as { id: number; company_id: number; name: string; created_at: string }[];
      return rows.map(r => ({ id: r.id, companyId: r.company_id, name: r.name, createdAt: r.created_at }));
    } catch (err) {
      console.error('[findCampsByCompany] error:', err);
      return [];
    }
  }

  public async createCamp(companyId: number, name: string): Promise<Camp> {
    const trimmed = name.trim();
    const validCompanyId = await this.getValidCompanyId(companyId);

    // 중복 체크
    const { data: existing } = await getDb()
      .from('camps')
      .select('*')
      .eq('company_id', validCompanyId)
      .ilike('name', trimmed)
      .maybeSingle();
    if (existing) {
      throw new Error(`이미 등록된 캠프명입니다. ('${trimmed}')`);
    }

    const { data, error } = await getDb()
      .from('camps')
      .insert({ company_id: validCompanyId, name: trimmed })
      .select()
      .single();
    if (error) throw error;
    console.log(`[createCamp SUCCESS] Saved to DB -> id: ${(data as { id: number }).id}, name: ${trimmed}`);
    const row = data as { id: number; company_id: number; name: string; created_at: string };
    return { id: row.id, companyId: row.company_id, name: row.name, createdAt: row.created_at };
  }

  public async deleteCamp(id: number): Promise<boolean> {
    try {
      const { error } = await getDb().from('camps').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[deleteCamp] error:', err);
    }
    return true;
  }

  // Routes
  public async findRoutesByCamp(campId: number): Promise<Route[]> {
    try {
      const { data, error } = await getDb()
        .from('routes')
        .select('*')
        .eq('camp_id', campId)
        .order('name', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as { id: number; camp_id: number; name: string; created_at: string }[];
      return rows.map(r => ({ id: r.id, campId: r.camp_id, name: r.name, createdAt: r.created_at }));
    } catch (err) {
      console.error('[findRoutesByCamp] error:', err);
      return [];
    }
  }

  public async createRoute(campId: number, name: string): Promise<Route> {
    const trimmed = name.trim();
    const { data: existing } = await getDb()
      .from('routes')
      .select('*')
      .eq('camp_id', campId)
      .ilike('name', trimmed)
      .maybeSingle();
    if (existing) {
      throw new Error(`이미 등록된 라우터명입니다. ('${trimmed}')`);
    }

    const { data, error } = await getDb()
      .from('routes')
      .insert({ camp_id: campId, name: trimmed })
      .select()
      .single();
    if (error) throw error;
    console.log(`[createRoute SUCCESS] Saved to DB -> id: ${(data as { id: number }).id}, name: ${trimmed}`);
    const row = data as { id: number; camp_id: number; name: string; created_at: string };
    return { id: row.id, campId: row.camp_id, name: row.name, createdAt: row.created_at };
  }

  public async deleteRoute(id: number): Promise<boolean> {
    try {
      const { error } = await getDb().from('routes').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[deleteRoute] error:', err);
    }
    return true;
  }
}

// ==========================================
// Driver Helpers
// ==========================================

async function getOrCreateCampId(campName: string, companyId?: number): Promise<number> {
  const trimmed = campName.trim();
  if (!trimmed) return 0;

  const sb = getDb();
  let targetCompanyId: number;

  if (companyId) {
    targetCompanyId = companyId;
  } else {
    const { data: allComp } = await sb.from('companies').select('*');
    const rows = (allComp || []) as { id: number; name: string }[];
    const daeguk = rows.find(c => c.name === DEFAULT_COMPANY_NAME);
    if (daeguk) {
      targetCompanyId = daeguk.id;
    } else {
      const { data: newComp, error } = await sb.from('companies').insert({ name: DEFAULT_COMPANY_NAME }).select().single();
      if (error) throw error;
      targetCompanyId = (newComp as { id: number }).id;
    }
  }

  const { data: existing } = await sb.from('camps').select('*').eq('company_id', targetCompanyId).eq('name', trimmed).maybeSingle();
  if (existing) return (existing as { id: number }).id;

  const { data: inserted, error } = await sb.from('camps').insert({ company_id: targetCompanyId, name: trimmed }).select().single();
  if (error) throw error;
  return (inserted as { id: number }).id;
}

async function saveCampRoutes(driverId: number, campStr: string, routesStr: string, companyId?: number) {
  const sb = getDb();
  await sb.from('driver_camp_routes').delete().eq('driver_id', driverId);

  const campArr = (campStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const routeArr = (routesStr || '').split(',').map(s => s.trim());

  for (let i = 0; i < campArr.length; i++) {
    const cName = campArr[i];
    const rName = routeArr[i] || '';
    if (!cName) continue;

    const campId = await getOrCreateCampId(cName, companyId);

    if (rName.trim()) {
      const { data: existingRoute } = await sb
        .from('routes')
        .select('*')
        .eq('camp_id', campId)
        .eq('name', rName.trim())
        .maybeSingle();

      let routeId: number;
      if (existingRoute) {
        routeId = (existingRoute as { id: number }).id;
      } else {
        const { data: insertedRoute, error } = await sb
          .from('routes')
          .insert({ camp_id: campId, name: rName.trim() })
          .select()
          .single();
        if (error) throw error;
        routeId = (insertedRoute as { id: number }).id;
      }

      await sb.from('driver_camp_routes').insert({
        driver_id: driverId,
        camp_id: campId,
        route_id: routeId,
        route_name: rName.trim(),
      });
    } else {
      await sb.from('driver_camp_routes').insert({
        driver_id: driverId,
        camp_id: campId,
        route_name: '',
      });
    }
  }
}

async function getDriverFull(driverRow: {
  id: number; company_id: number | null; driver_code: string; name: string;
  phone: string; contract_type: string; created_at: string; is_deleted: boolean;
}): Promise<Driver> {
  const sb = getDb();

  const { data: mappingsData } = await sb
    .from('driver_camp_routes')
    .select('camp_id, route_id, route_name, camps(name)')
    .eq('driver_id', driverRow.id);

  type MappingRow = { camp_id: number; route_id: number | null; route_name: string; camps: { name: string } | null };
  const mappings = (mappingsData || []) as unknown as MappingRow[];

  let companyName = '';
  if (driverRow.company_id) {
    const { data: compRow } = await sb.from('companies').select('name').eq('id', driverRow.company_id).single();
    if (compRow) companyName = (compRow as { name: string }).name;
  }

  const campNames = mappings.map(m => m.camps?.name || '');
  const routes = mappings.map(m => m.route_name);

  return {
    id: driverRow.id,
    companyId: driverRow.company_id ?? undefined,
    companyName,
    driverCode: driverRow.driver_code || '',
    name: driverRow.name,
    phone: driverRow.phone,
    camp: campNames.join(','),
    routes: routes.join(','),
    contractType: driverRow.contract_type as Driver['contractType'],
    createdAt: driverRow.created_at,
    isDeleted: driverRow.is_deleted,
    campRoutes: mappings.map(m => ({
      campId: m.camp_id,
      campName: m.camps?.name || '',
      routeId: m.route_id ?? undefined,
      route: m.route_name,
    })),
  };
}

// ==========================================
// DriverRepository
// ==========================================

class DriverRepository {
  public async findAll(includeDeleted = false): Promise<Driver[]> {
    const sb = getDb();
    const query = sb.from('drivers').select('*').order('id');
    const { data: driverRows, error } = includeDeleted ? await query : await query.eq('is_deleted', false);
    if (error) throw error;

    const filteredDrivers = (driverRows || []) as {
      id: number; company_id: number | null; driver_code: string; name: string;
      phone: string; contract_type: string; created_at: string; is_deleted: boolean;
    }[];
    if (filteredDrivers.length === 0) return [];

    // 배치 조회
    const { data: allCampRoutesData } = await sb
      .from('driver_camp_routes')
      .select('driver_id, camp_id, route_id, route_name, camps(name)');
    const { data: compRowsData } = await sb.from('companies').select('id, name');

    type AllCampRouteRow = { driver_id: number; camp_id: number; route_id: number | null; route_name: string; camps: { name: string } | null };
    const allCampRoutes = (allCampRoutesData || []) as unknown as AllCampRouteRow[];
    const compMap = new Map(
      ((compRowsData || []) as { id: number; name: string }[]).map(c => [c.id, c.name])
    );

    const mappingMap = new Map<number, typeof allCampRoutes>();
    allCampRoutes.forEach(r => {
      const list = mappingMap.get(r.driver_id) || [];
      list.push(r);
      mappingMap.set(r.driver_id, list);
    });

    return filteredDrivers.map(d => {
      const mappings = mappingMap.get(d.id) || [];
      return {
        id: d.id,
        companyId: d.company_id ?? undefined,
        companyName: d.company_id ? compMap.get(d.company_id) : undefined,
        driverCode: d.driver_code || '',
        name: d.name,
        phone: d.phone,
        camp: mappings.map(m => m.camps?.name || '').join(','),
        routes: mappings.map(m => m.route_name).join(','),
        contractType: d.contract_type as Driver['contractType'],
        createdAt: d.created_at,
        isDeleted: d.is_deleted,
        campRoutes: mappings.map(m => ({
          campId: m.camp_id,
          campName: m.camps?.name || '',
          routeId: m.route_id ?? undefined,
          route: m.route_name,
        })),
      };
    });
  }

  public async findById(id: number): Promise<Driver | undefined> {
    const sb = getDb();
    const { data, error } = await sb.from('drivers').select('*').eq('id', id).eq('is_deleted', false).single();
    if (error || !data) return undefined;
    return getDriverFull(data as Parameters<typeof getDriverFull>[0]);
  }

  public async create(dto: CreateDriverDTO): Promise<Driver> {
    const sb = getDb();
    const { data: row, error } = await sb
      .from('drivers')
      .insert({
        company_id: dto.companyId,
        driver_code: (dto.driverCode ?? '').trim(),
        name: dto.name,
        phone: dto.phone,
        contract_type: dto.contractType,
        is_deleted: false,
      })
      .select()
      .single();
    if (error) throw error;

    const driverRow = row as Parameters<typeof getDriverFull>[0];
    await saveCampRoutes(driverRow.id, dto.camp, dto.routes, dto.companyId);
    return getDriverFull(driverRow);
  }

  public async update(id: number, dto: UpdateDriverDTO): Promise<Driver | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sb = getDb();
    const { data: row, error } = await sb
      .from('drivers')
      .update({
        company_id: dto.companyId !== undefined ? dto.companyId : existing.companyId,
        driver_code: dto.driverCode !== undefined ? dto.driverCode.trim() : existing.driverCode,
        name: dto.name ?? existing.name,
        phone: dto.phone ?? existing.phone,
        contract_type: dto.contractType ?? existing.contractType,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    if (row && (dto.camp !== undefined || dto.routes !== undefined)) {
      const campStr = dto.camp !== undefined ? dto.camp : existing.camp;
      const routesStr = dto.routes !== undefined ? dto.routes : existing.routes;
      await saveCampRoutes(id, campStr, routesStr, dto.companyId ?? existing.companyId);
    }

    return row ? getDriverFull(row as Parameters<typeof getDriverFull>[0]) : null;
  }

  public async softDelete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    const sb = getDb();
    // 기사와 연결된 driver_camp_routes 데이터 함께 삭제
    await sb.from('driver_camp_routes').delete().eq('driver_id', id);
    const { error } = await sb.from('drivers').update({ is_deleted: true }).eq('id', id);
    if (error) throw error;
    return true;
  }

  public async delete(id: number): Promise<boolean> {
    const sb = getDb();
    // 기사와 연결된 driver_camp_routes 및 스케줄 데이터 함께 삭제
    await sb.from('driver_camp_routes').delete().eq('driver_id', id);
    await sb.from('schedule_shifts').delete().eq('driver_id', id);
    const { error } = await sb.from('drivers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

// ==========================================
// ScheduleRepository
// ==========================================

class ScheduleRepository {
  public async findShifts(startDate?: string, endDate?: string, driverId?: number): Promise<ScheduleShift[]> {
    const sb = getDb();
    let query = sb.from('schedule_shifts').select('*');
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (driverId !== undefined) query = query.eq('driver_id', driverId);

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as { id: number; driver_id: number; date: string; status: string }[];
    return rows.map(r => ({ id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] }));
  }

  public async findShift(driverId: number, date: string): Promise<ScheduleShift | undefined> {
    const { data, error } = await getDb()
      .from('schedule_shifts')
      .select('*')
      .eq('driver_id', driverId)
      .eq('date', date)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    const r = data as { id: number; driver_id: number; date: string; status: string };
    return { id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] };
  }

  public async upsertShift(driverId: number, date: string, status: ScheduleShift['status']): Promise<ScheduleShift> {
    const existing = await this.findShift(driverId, date);
    const sb = getDb();

    if (existing) {
      const { data, error } = await sb
        .from('schedule_shifts')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      const r = data as { id: number; driver_id: number; date: string; status: string };
      return { id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] };
    }

    const { data, error } = await sb
      .from('schedule_shifts')
      .insert({ driver_id: driverId, date, status })
      .select()
      .single();
    if (error) throw error;
    const r = data as { id: number; driver_id: number; date: string; status: string };
    return { id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] };
  }

  public async getOffDays(startDate?: string, endDate?: string): Promise<ScheduleShift[]> {
    const sb = getDb();
    let query = sb.from('schedule_shifts').select('*').eq('status', '휴무');
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as { id: number; driver_id: number; date: string; status: string }[];
    return rows.map(r => ({ id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] }));
  }
}

// ==========================================
// BackupRepository
// ==========================================

class BackupRepository {
  private toBackup(row: {
    id: number; date: string; route_number: string;
    original_driver_id: number; original_driver_name: string;
    backup_driver_id: number; backup_driver_name: string;
    note: string | null; created_at: string;
  }): BackupAssignment {
    return {
      id: row.id,
      date: row.date,
      routeNumber: row.route_number,
      originalDriverId: row.original_driver_id,
      originalDriverName: row.original_driver_name,
      backupDriverId: row.backup_driver_id,
      backupDriverName: row.backup_driver_name,
      note: row.note ?? undefined,
      createdAt: row.created_at,
    };
  }

  public async findAll(): Promise<BackupAssignment[]> {
    const { data, error } = await getDb().from('backup_assignments').select('*').order('id');
    if (error) throw error;
    return ((data || []) as Parameters<BackupRepository['toBackup']>[0][]).map(r => this.toBackup(r));
  }

  public async findByDateAndRoute(date: string, routeNumber: string): Promise<BackupAssignment | undefined> {
    const { data } = await getDb()
      .from('backup_assignments')
      .select('*')
      .eq('date', date)
      .eq('route_number', routeNumber)
      .maybeSingle();
    return data ? this.toBackup(data as Parameters<BackupRepository['toBackup']>[0]) : undefined;
  }

  public async findByDate(date: string): Promise<BackupAssignment[]> {
    const { data, error } = await getDb()
      .from('backup_assignments')
      .select('*')
      .eq('date', date);
    if (error) throw error;
    return ((data || []) as Parameters<BackupRepository['toBackup']>[0][]).map(r => this.toBackup(r));
  }

  public async assignBackup(dto: AssignBackupDTO): Promise<BackupAssignment | null> {
    const originalDriver = await driverRepository.findById(dto.originalDriverId);
    const backupDriver = await driverRepository.findById(dto.backupDriverId);
    if (!originalDriver || !backupDriver) return null;

    const sb = getDb();
    await sb.from('backup_assignments')
      .delete()
      .eq('date', dto.date)
      .eq('route_number', dto.routeNumber);

    const { data, error } = await sb
      .from('backup_assignments')
      .insert({
        date: dto.date,
        route_number: dto.routeNumber,
        original_driver_id: originalDriver.id,
        original_driver_name: originalDriver.name,
        backup_driver_id: backupDriver.id,
        backup_driver_name: backupDriver.name,
        note: dto.note || '수동 지정 완료',
      })
      .select()
      .single();
    if (error) throw error;
    return this.toBackup(data as Parameters<BackupRepository['toBackup']>[0]);
  }

  public async removeAssignment(date: string, routeNumber: string): Promise<boolean> {
    const existing = await this.findByDateAndRoute(date, routeNumber);
    if (!existing) return false;

    await getDb()
      .from('backup_assignments')
      .delete()
      .eq('date', date)
      .eq('route_number', routeNumber);
    return true;
  }
}

export const masterRepository = new MasterRepository();
export const driverRepository = new DriverRepository();
export const scheduleRepository = new ScheduleRepository();
export const backupRepository = new BackupRepository();
