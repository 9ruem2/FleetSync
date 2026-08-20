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
    const trimmedId = userId.trim();
    try {
      const sb = getDb();
      const { data, error } = await sb
        .from('companies')
        .select('id, name, user_id, password')
        .eq('user_id', trimmedId)
        .eq('password', password)
        .maybeSingle();

      if (!error && data) {
        const row = data as { id: number; name: string; user_id: string; password: string };
        return { id: row.id, name: row.name };
      }

      // 만약 kkh / 1010 기본 계정인데 아직 DB에 컬럼이 안 채워져 있다면 '대국' 회사에 자동 동기화
      if (trimmedId === 'kkh' && password === '1010') {
        const validCompId = await this.getValidCompanyId();
        try {
          await sb.from('companies').update({ user_id: 'kkh', password: '1010' }).eq('id', validCompId);
        } catch (updateErr) {
          console.error('[findCompanyByCredentials auto-sync error]:', updateErr);
        }
        return { id: validCompId, name: DEFAULT_COMPANY_NAME };
      }

      return null;
    } catch (err) {
      console.error('[findCompanyByCredentials] error:', err);
      // DB 통신 장애 시 kkh/1010 기본 계정 안전 통과
      if (trimmedId === 'kkh' && password === '1010') {
        return { id: 1, name: DEFAULT_COMPANY_NAME };
      }
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
  public async findAllCamps(): Promise<Camp[]> {
    try {
      const { data, error } = await getDb()
        .from('camps')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      const rows = (data || []) as { id: number; company_id: number; name: string; created_at: string }[];
      return rows.map(r => ({ id: r.id, companyId: r.company_id, name: r.name, createdAt: r.created_at }));
    } catch (err) {
      console.error('[findAllCamps] error:', err);
      return [];
    }
  }

  public async findCampsByCompany(companyId: number): Promise<Camp[]> {
    try {
      const validCompanyId = await this.getValidCompanyId(companyId);
      const { data, error } = await getDb()
        .from('camps')
        .select('*')
        .eq('company_id', validCompanyId)
        .order('name', { ascending: true });
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
      await getDb().from('routes').delete().eq('camp_id', id);
      const { error } = await getDb().from('camps').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[deleteCamp] error:', err);
    }
    return true;
  }

  // Routes
  public async findAllRoutes(): Promise<Route[]> {
    try {
      const { data, error } = await getDb()
        .from('routes')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      const rows = (data || []) as { id: number; camp_id: number; name: string; created_at: string }[];
      return rows.map(r => ({ id: r.id, campId: r.camp_id, name: r.name, createdAt: r.created_at }));
    } catch (err) {
      console.error('[findAllRoutes] error:', err);
      return [];
    }
  }

  public async findRoutesByCamp(campId: number): Promise<Route[]> {
    try {
      const { data, error } = await getDb()
        .from('routes')
        .select('*')
        .eq('camp_id', campId)
        .order('name', { ascending: true });
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

  if (campArr.length === 0) return;

  // 1. Target Company ID 확인
  let targetCompanyId: number;
  if (companyId) {
    targetCompanyId = companyId;
  } else {
    const { data: allComp } = await sb.from('companies').select('id, name');
    const rows = (allComp || []) as { id: number; name: string }[];
    const daeguk = rows.find(c => c.name === DEFAULT_COMPANY_NAME);
    if (daeguk) {
      targetCompanyId = daeguk.id;
    } else if (rows.length > 0) {
      targetCompanyId = rows[0].id;
    } else {
      const { data: newComp } = await sb.from('companies').insert({ name: DEFAULT_COMPANY_NAME }).select().single();
      targetCompanyId = (newComp as { id: number }).id;
    }
  }

  // 2. 입력된 캠프들을 한 번에 조회 및 없는 캠프 일괄 생성
  const uniqueCampNames = Array.from(new Set(campArr));
  const { data: existingCampsData } = await sb
    .from('camps')
    .select('id, name')
    .eq('company_id', targetCompanyId);

  const existingCamps = (existingCampsData || []) as { id: number; name: string }[];
  const campMap = new Map<string, number>();
  existingCamps.forEach(c => campMap.set(c.name.toLowerCase(), c.id));

  // 없는 캠프 생성
  const campsToCreate = uniqueCampNames.filter(c => !campMap.has(c.toLowerCase()));
  if (campsToCreate.length > 0) {
    const { data: insertedCamps } = await sb
      .from('camps')
      .insert(campsToCreate.map(name => ({ company_id: targetCompanyId, name })))
      .select();
    ((insertedCamps || []) as { id: number; name: string }[]).forEach(c => {
      campMap.set(c.name.toLowerCase(), c.id);
    });
  }

  // 3. 라우터 일괄 처리
  const campIds = Array.from(campMap.values());
  const { data: existingRoutesData } = await sb
    .from('routes')
    .select('id, camp_id, name')
    .in('camp_id', campIds);

  const existingRoutes = (existingRoutesData || []) as { id: number; camp_id: number; name: string }[];
  const routeMap = new Map<string, number>(); // "campId_routeName" -> routeId
  existingRoutes.forEach(r => routeMap.set(`${r.camp_id}_${r.name.toLowerCase()}`, r.id));

  const mappingInserts: { driver_id: number; camp_id: number; route_id: number | null; route_name: string }[] = [];

  for (let i = 0; i < campArr.length; i++) {
    const cName = campArr[i];
    const rName = routeArr[i] || '';
    const campId = campMap.get(cName.toLowerCase());
    if (!campId) continue;

    if (rName.trim()) {
      const routeKey = `${campId}_${rName.trim().toLowerCase()}`;
      let routeId = routeMap.get(routeKey);

      if (!routeId) {
        // 새 라우터 생성
        const { data: insertedRoute } = await sb
          .from('routes')
          .insert({ camp_id: campId, name: rName.trim() })
          .select()
          .single();
        if (insertedRoute) {
          routeId = (insertedRoute as { id: number }).id;
          routeMap.set(routeKey, routeId);
        }
      }

      mappingInserts.push({
        driver_id: driverId,
        camp_id: campId,
        route_id: routeId ?? null,
        route_name: rName.trim(),
      });
    } else {
      mappingInserts.push({
        driver_id: driverId,
        camp_id: campId,
        route_id: null,
        route_name: '',
      });
    }
  }

  // 4. driver_camp_routes 한 번에 일괄 삽입
  if (mappingInserts.length > 0) {
    await sb.from('driver_camp_routes').insert(mappingInserts);
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
  const mappings = ((mappingsData || []) as unknown as MappingRow[]).sort((a, b) => {
    const campComp = (a.camps?.name || '').localeCompare(b.camps?.name || '', undefined, { numeric: true });
    if (campComp !== 0) return campComp;
    return a.route_name.localeCompare(b.route_name, undefined, { numeric: true });
  });

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
    try {
      const sb = getDb();
      const query = sb.from('drivers').select('*').order('id');
      // is_deleted = false 이거나 is_deleted IS NULL 인 데이터 모두 조회 (삭제된 true만 제외)
      const { data: driverRows, error } = includeDeleted
        ? await query
        : await query.or('is_deleted.eq.false,is_deleted.is.null');

      if (error) {
        console.error('[DriverRepository.findAll error]:', error);
        return [];
      }

      const filteredDrivers = (driverRows || []) as {
        id: number; company_id: number | null; driver_code: string; name: string;
        phone: string; contract_type: string; created_at: string; is_deleted: boolean | null;
      }[];

      if (filteredDrivers.length === 0) return [];

      // 배치 조회
      const { data: allCampRoutesData, error: campRouteErr } = await sb
        .from('driver_camp_routes')
        .select('driver_id, camp_id, route_id, route_name, camps(name)');
      if (campRouteErr) {
        console.error('[DriverRepository driver_camp_routes error]:', campRouteErr);
      }

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

      mappingMap.forEach(list => {
        list.sort((a, b) => {
          const campComp = (a.camps?.name || '').localeCompare(b.camps?.name || '', undefined, { numeric: true });
          if (campComp !== 0) return campComp;
          return a.route_name.localeCompare(b.route_name, undefined, { numeric: true });
        });
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
          isDeleted: !!d.is_deleted,
          campRoutes: mappings.map(m => ({
            campId: m.camp_id,
            campName: m.camps?.name || '',
            routeId: m.route_id ?? undefined,
            route: m.route_name,
          })),
        };
      });
    } catch (err) {
      console.error('[DriverRepository.findAll exception]:', err);
      return [];
    }
  }

  public async findById(id: number): Promise<Driver | undefined> {
    try {
      const sb = getDb();
      const { data, error } = await sb.from('drivers').select('*').eq('id', id).maybeSingle();
      if (error || !data) return undefined;
      const row = data as Parameters<typeof getDriverFull>[0];
      if (row.is_deleted) return undefined;
      return getDriverFull(row);
    } catch (err) {
      console.error('[DriverRepository.findById error]:', err);
      return undefined;
    }
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
    try {
      const sb = getDb();
      let query = sb.from('schedule_shifts').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      if (driverId !== undefined) query = query.eq('driver_id', driverId);

      const { data, error } = await query;
      if (error) {
        console.error('[findShifts error]:', error);
        return [];
      }
      const rows = (data || []) as { id: number; driver_id: number; date: string; status: string }[];
      return rows.map(r => ({ id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] }));
    } catch (err) {
      console.error('[findShifts exception]:', err);
      return [];
    }
  }

  public async findShift(driverId: number, date: string): Promise<ScheduleShift | undefined> {
    try {
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
    } catch (err) {
      console.error('[findShift error]:', err);
      return undefined;
    }
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
    try {
      const sb = getDb();
      let query = sb.from('schedule_shifts').select('*').eq('status', '휴무');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) {
        console.error('[getOffDays error]:', error);
        return [];
      }
      const rows = (data || []) as { id: number; driver_id: number; date: string; status: string }[];
      return rows.map(r => ({ id: r.id, driverId: r.driver_id, date: r.date, status: r.status as ScheduleShift['status'] }));
    } catch (err) {
      console.error('[getOffDays exception]:', err);
      return [];
    }
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
    try {
      const { data, error } = await getDb().from('backup_assignments').select('*').order('id');
      if (error) {
        console.error('[findAll backupAssignments error]:', error);
        return [];
      }
      return ((data || []) as Parameters<BackupRepository['toBackup']>[0][]).map(r => this.toBackup(r));
    } catch (err) {
      console.error('[findAll backupAssignments exception]:', err);
      return [];
    }
  }

  public async findByDateAndRoute(date: string, routeNumber: string): Promise<BackupAssignment | undefined> {
    try {
      const { data } = await getDb()
        .from('backup_assignments')
        .select('*')
        .eq('date', date)
        .eq('route_number', routeNumber)
        .maybeSingle();
      return data ? this.toBackup(data as Parameters<BackupRepository['toBackup']>[0]) : undefined;
    } catch (err) {
      console.error('[findByDateAndRoute error]:', err);
      return undefined;
    }
  }

  public async findByDate(date: string): Promise<BackupAssignment[]> {
    try {
      const { data, error } = await getDb()
        .from('backup_assignments')
        .select('*')
        .eq('date', date);
      if (error) {
        console.error('[findByDate error]:', error);
        return [];
      }
      return ((data || []) as Parameters<BackupRepository['toBackup']>[0][]).map(r => this.toBackup(r));
    } catch (err) {
      console.error('[findByDate exception]:', err);
      return [];
    }
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
