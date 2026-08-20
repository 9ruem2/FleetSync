import { masterRepository, driverRepository } from '../repositories/dbRepository';
import { driverService, scheduleService, backupService } from '../services/index';
import { CreateDriverDTO, UpdateDriverDTO, UpdateShiftStatusDTO, AssignBackupDTO } from '../types';
import { getDb } from '../../../db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ success: false, message }, status);
}

async function parseBody<T>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function handleApiRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  let rawPath = url.pathname.replace(/\/$/, '') || '/';
  if (rawPath.startsWith('/.netlify/functions/api')) {
    rawPath = rawPath.replace('/.netlify/functions/api', '/api');
  }
  const path = rawPath;
  const method = req.method;

  try {
    // Health check (상세 진단 정보 포함)
    if (path === '/api/health' && method === 'GET') {
      try {
        const sb = getDb();
        const { count: companyCount, error: compErr } = await sb.from('companies').select('*', { count: 'exact', head: true });
        const { count: driverCount, error: driverErr } = await sb.from('drivers').select('*', { count: 'exact', head: true });
        const { count: campCount, error: campErr } = await sb.from('camps').select('*', { count: 'exact', head: true });
        
        const hasServiceKey = !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

        return jsonResponse({
          success: true,
          data: {
            status: 'ok',
            db: 'connected',
            keyType: hasServiceKey ? 'service_role (RLS bypass)' : 'publishable / anon',
            stats: {
              companies: companyCount ?? 0,
              drivers: driverCount ?? 0,
              camps: campCount ?? 0,
            },
            errors: {
              company: compErr ? compErr.message : null,
              driver: driverErr ? driverErr.message : null,
              camp: campErr ? campErr.message : null,
            },
            system: 'Coupang Fleet Sync API',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : 'DB connection failed';
        console.error('[api/health] DB error:', dbError);
        return errorResponse(`Database unavailable: ${msg}`, 503);
      }
    }

    // ==========================================
    // Auth API
    // ==========================================

    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody<{ userId: string; password: string }>(req);
      if (!body.userId || !body.password) {
        return errorResponse('아이디와 비밀번호를 모두 입력해주세요.', 400);
      }
      const company = await masterRepository.findCompanyByCredentials(body.userId, body.password);
      if (!company) {
        return errorResponse('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
      }
      return jsonResponse({
        success: true,
        data: {
          userId: body.userId,
          companyId: company.id,
          companyName: company.name,
        }
      });
    }

    // ==========================================
    // Master Data APIs (Company / Camp / Route)
    // ==========================================

    // Companies
    if (path === '/api/companies' && method === 'GET') {
      try {
        const data = await masterRepository.findAllCompanies();
        return jsonResponse({ success: true, data });
      } catch (err) {
        console.error('[GET /api/companies] error fallback:', err);
        return jsonResponse({
          success: true,
          data: [{ id: 1, name: '대국', createdAt: new Date().toISOString() }]
        });
      }
    }
    if (path === '/api/companies' && method === 'POST') {
      const body = await parseBody<{ name: string }>(req);
      if (!body.name?.trim()) return errorResponse('회사명을 입력해주세요', 400);
      const data = await masterRepository.createCompany(body.name);
      return jsonResponse({ success: true, data, message: '회사가 생성되었습니다' }, 201);
    }
    const companyMatch = path.match(/^\/api\/companies\/([^/]+)$/);
    if (companyMatch && method === 'DELETE') {
      const id = parseId(companyMatch[1]);
      if (id === null) return errorResponse('유효하지 않은 회사 ID입니다', 400);
      await masterRepository.deleteCompany(id);
      return jsonResponse({ success: true, message: '회사가 삭제되었습니다' });
    }

    // Camps
    if (path === '/api/camps' && method === 'GET') {
      const companyIdStr = url.searchParams.get('companyId');
      const companyId = companyIdStr ? parseId(companyIdStr) : null;
      const data = companyId !== null
        ? await masterRepository.findCampsByCompany(companyId)
        : await masterRepository.findAllCamps();
      return jsonResponse({ success: true, data });
    }
    if (path === '/api/camps' && method === 'POST') {
      const body = await parseBody<{ companyId: number; name: string }>(req);
      if (!body.name?.trim()) return errorResponse('캠프명을 입력해주세요', 400);
      const data = await masterRepository.createCamp(body.companyId, body.name);
      return jsonResponse({ success: true, data, message: '캠프가 생성되었습니다' }, 201);
    }
    const campMatch = path.match(/^\/api\/camps\/([^/]+)$/);
    if (campMatch && method === 'DELETE') {
      const id = parseId(campMatch[1]);
      if (id === null) return errorResponse('유효하지 않은 캠프 ID입니다', 400);
      await masterRepository.deleteCamp(id);
      return jsonResponse({ success: true, message: '캠프가 삭제되었습니다' });
    }

    // Routes
    if (path === '/api/routes' && method === 'GET') {
      const campIdStr = url.searchParams.get('campId');
      const campId = campIdStr ? parseId(campIdStr) : null;
      const data = campId !== null
        ? await masterRepository.findRoutesByCamp(campId)
        : await masterRepository.findAllRoutes();
      return jsonResponse({ success: true, data });
    }
    if (path === '/api/routes' && method === 'POST') {
      const body = await parseBody<{ campId: number; name: string }>(req);
      if (!body.campId || !body.name?.trim()) return errorResponse('campId와 라우터명을 입력해주세요', 400);
      try {
        const data = await masterRepository.createRoute(body.campId, body.name);
        return jsonResponse({ success: true, data, message: '라우터가 생성되었습니다' }, 201);
      } catch (err: any) {
        return errorResponse(err.message || '라우터 등록 실패', 400);
      }
    }
    const routeMatch = path.match(/^\/api\/routes\/([^/]+)$/);
    if (routeMatch && method === 'DELETE') {
      const id = parseId(routeMatch[1]);
      if (id === null) return errorResponse('유효하지 않은 라우트 ID입니다', 400);
      await masterRepository.deleteRoute(id);
      return jsonResponse({ success: true, message: '라우트가 삭제되었습니다' });
    }

    // ==========================================
    // Drivers
    // ==========================================
    if (path === '/api/drivers' && method === 'GET') {
      const drivers = await driverService.getAllDrivers(
        url.searchParams.get('search') ?? undefined,
        url.searchParams.get('route') ?? undefined,
        url.searchParams.get('contractType') ?? undefined
      );
      return jsonResponse({ success: true, data: drivers });
    }

    const driverMatch = path.match(/^\/api\/drivers\/([^/]+)$/);
    if (driverMatch) {
      const id = parseId(driverMatch[1]);
      if (id === null) return errorResponse('유효하지 않은 기사 ID입니다', 400);

      if (method === 'GET') {
        const driver = await driverService.getDriverById(id);
        if (!driver) return errorResponse('기사를 찾을 수 없습니다', 404);
        return jsonResponse({ success: true, data: driver });
      }

      if (method === 'PUT') {
        const body = await parseBody<UpdateDriverDTO>(req);
        const updated = await driverService.updateDriver(id, body);
        return jsonResponse({ success: true, data: updated, message: '기사 정보가 수정되었습니다' });
      }

      if (method === 'DELETE') {
        await driverService.deleteDriver(id);
        return jsonResponse({ success: true, message: '기사 정보가 소프트 삭제 처리되었습니다' });
      }
    }

    if (path === '/api/drivers' && method === 'POST') {
      const body = await parseBody<CreateDriverDTO>(req);
      const newDriver = await driverService.createDriver(body);
      return jsonResponse({ success: true, data: newDriver, message: '기사가 신규 등록되었습니다' }, 201);
    }

    // Schedules
    if (path === '/api/schedules/grid' && method === 'GET') {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      if (!startDate || !endDate) {
        return errorResponse('startDate와 endDate 조회가 필요합니다', 400);
      }
      try {
        const grid = await scheduleService.getScheduleGrid(startDate, endDate);
        return jsonResponse({ success: true, data: grid });
      } catch (err: any) {
        console.error('[GET /api/schedules/grid error]:', err);
        return errorResponse(err.message || '스케줄 그리드 조회 실패', 500);
      }
    }

    if (path === '/api/schedules/cell' && method === 'PUT') {
      const body = await parseBody<UpdateShiftStatusDTO>(req);
      if (!body.driverId || !body.date || !body.status) {
        return errorResponse('driverId, date, status 정보가 필수입니다', 400);
      }
      try {
        const shift = await scheduleService.updateCellStatus(body.driverId, body.date, body.status);
        return jsonResponse({ success: true, data: shift, message: '근무 상태가 수정되었습니다' });
      } catch (err: any) {
        return errorResponse(err.message || '근무 상태 수정 실패', 400);
      }
    }

    if (path === '/api/schedules/offdays' && method === 'GET') {
      try {
        const offDays = await scheduleService.getOffDaySummary(
          url.searchParams.get('startDate') ?? undefined,
          url.searchParams.get('endDate') ?? undefined
        );
        return jsonResponse({ success: true, data: offDays });
      } catch (err: any) {
        return errorResponse(err.message || '휴무 목록 조회 실패', 500);
      }
    }

    // Backups
    if (path === '/api/backups' && method === 'GET') {
      try {
        const assignments = await backupService.getAllAssignments();
        return jsonResponse({ success: true, data: assignments });
      } catch (err: any) {
        return errorResponse(err.message || '백업 지정 목록 조회 실패', 500);
      }
    }

    if (path === '/api/backups/candidates' && method === 'GET') {
      const date = url.searchParams.get('date');
      if (!date) return errorResponse('조회 기준 날짜(date)가 필요합니다', 400);
      try {
        const candidates = await backupService.getAvailableBackupDrivers(date);
        return jsonResponse({ success: true, data: candidates });
      } catch (err: any) {
        return errorResponse(err.message || '백업 후보 조회 실패', 500);
      }
    }

    if (path === '/api/backups/assign' && method === 'POST') {
      const body = await parseBody<AssignBackupDTO>(req);
      const assignment = await backupService.assignBackup(body);
      return jsonResponse({ success: true, data: assignment, message: '대차 기사가 지정되었습니다' }, 201);
    }

    // ==========================================
    // Monthly Rosters CRUD Endpoints (신규 테이블)
    // ==========================================
    const { monthlyRosterRepository } = await import('../repositories/dbRepository');

    if (path === '/api/monthly-rosters' && method === 'GET') {
      try {
        const rosters = await monthlyRosterRepository.findAll();
        return jsonResponse({ success: true, data: rosters });
      } catch (err: any) {
        return errorResponse(err.message || '월별 근무표 목록 조회 실패', 500);
      }
    }

    if (path.startsWith('/api/monthly-rosters/') && method === 'GET') {
      const idRaw = path.split('/')[3];
      const id = parseId(idRaw);
      if (!id) return errorResponse('유효한 근무표 ID가 필요합니다', 400);
      try {
        const roster = await monthlyRosterRepository.findById(id);
        if (!roster) return errorResponse('해당 월별 근무표를 찾을 수 없습니다', 404);
        return jsonResponse({ success: true, data: roster });
      } catch (err: any) {
        return errorResponse(err.message || '월별 근무표 조회 실패', 500);
      }
    }

    if (path === '/api/monthly-rosters' && method === 'POST') {
      try {
        const body = await parseBody<any>(req);
        if (!body.targetMonth || !body.title || !Array.isArray(body.items)) {
          return errorResponse('targetMonth, title, items 목록이 필수입니다', 400);
        }
        const created = await monthlyRosterRepository.create(body);
        return jsonResponse({ success: true, data: created, message: '월별 근무표가 DB에 성공적으로 저장되었습니다' }, 201);
      } catch (err: any) {
        return errorResponse(err.message || '월별 근무표 저장 실패', 500);
      }
    }

    if (path.startsWith('/api/monthly-rosters/') && method === 'PUT') {
      const idRaw = path.split('/')[3];
      const id = parseId(idRaw);
      if (!id) return errorResponse('유효한 근무표 ID가 필요합니다', 400);
      try {
        const body = await parseBody<any>(req);
        const updated = await monthlyRosterRepository.update(id, body);
        if (!updated) return errorResponse('해당 월별 근무표를 찾을 수 없습니다', 404);
        return jsonResponse({ success: true, data: updated, message: '월별 근무표가 수정되었습니다' });
      } catch (err: any) {
        return errorResponse(err.message || '월별 근무표 수정 실패', 500);
      }
    }

    if (path.startsWith('/api/monthly-rosters/') && method === 'DELETE') {
      const idRaw = path.split('/')[3];
      const id = parseId(idRaw);
      if (!id) return errorResponse('유효한 근무표 ID가 필요합니다', 400);
      try {
        const deleted = await monthlyRosterRepository.delete(id);
        return jsonResponse({ success: true, data: { id, deleted }, message: '월별 근무표가 삭제되었습니다' });
      } catch (err: any) {
        return errorResponse(err.message || '월별 근무표 삭제 실패', 500);
      }
    }

    return errorResponse('Not Found', 404);
  } catch (error: unknown) {
    console.error('[api] Request error:', { path, method, error });
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('찾을') || message.includes('삭제') ? 400 : 500;
    return errorResponse(message, status);
  }
}
