import { driverService, scheduleService, backupService } from '../services/index';
import { CreateDriverDTO, UpdateDriverDTO, UpdateShiftStatusDTO, AssignBackupDTO } from '../types';
import { getDb } from '../../../db';
import { drivers } from '../../../db/schema';

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

function parseDriverId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function handleApiRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  const method = req.method;

  try {
    // Health check
    if (path === '/api/health' && method === 'GET') {
      try {
        await getDb().select({ id: drivers.id }).from(drivers).limit(1);
        return jsonResponse({
          success: true,
          data: {
            status: 'ok',
            db: 'connected',
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

    // Drivers
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
      const id = parseDriverId(driverMatch[1]);
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
      const grid = await scheduleService.getScheduleGrid(startDate, endDate);
      return jsonResponse({ success: true, data: grid });
    }

    if (path === '/api/schedules/cell' && method === 'PUT') {
      const body = await parseBody<UpdateShiftStatusDTO>(req);
      if (!body.driverId || !body.date || !body.status) {
        return errorResponse('driverId, date, status 정보가 필수입니다', 400);
      }
      const shift = await scheduleService.updateCellStatus(body.driverId, body.date, body.status);
      return jsonResponse({ success: true, data: shift, message: '근무 상태가 수정되었습니다' });
    }

    if (path === '/api/schedules/offdays' && method === 'GET') {
      const offDays = await scheduleService.getOffDaySummary(
        url.searchParams.get('startDate') ?? undefined,
        url.searchParams.get('endDate') ?? undefined
      );
      return jsonResponse({ success: true, data: offDays });
    }

    // Backups
    if (path === '/api/backups' && method === 'GET') {
      const assignments = await backupService.getAllAssignments();
      return jsonResponse({ success: true, data: assignments });
    }

    if (path === '/api/backups/candidates' && method === 'GET') {
      const date = url.searchParams.get('date');
      if (!date) return errorResponse('조회 기준 날짜(date)가 필요합니다', 400);
      const candidates = await backupService.getAvailableBackupDrivers(date);
      return jsonResponse({ success: true, data: candidates });
    }

    if (path === '/api/backups/assign' && method === 'POST') {
      const body = await parseBody<AssignBackupDTO>(req);
      const assignment = await backupService.assignBackup(body);
      return jsonResponse({ success: true, data: assignment, message: '대차 기사가 지정되었습니다' }, 201);
    }

    return errorResponse('Not Found', 404);
  } catch (error: unknown) {
    console.error('[api] Request error:', { path, method, error });
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('찾을') || message.includes('삭제') ? 400 : 500;
    return errorResponse(message, status);
  }
}
