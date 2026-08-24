import { getDb } from "../../../db";
import {
  CORS_HEADERS,
  jsonResponse,
  errorResponse,
  parseId,
  authController,
  adminController,
  masterController,
  driverController,
  scheduleController,
  backupController,
  monthlyRosterController,
} from "../controllers";

export async function handleApiRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const method = req.method;

  try {
    // Health check (상세 진단 정보)
    if (path === "/api/health" && method === "GET") {
      try {
        const sb = getDb();
        const { count: companyCount, error: compErr } = await sb
          .from("companies")
          .select("*", { count: "exact", head: true });
        const { count: driverCount, error: driverErr } = await sb
          .from("drivers")
          .select("*", { count: "exact", head: true });
        const { count: campCount, error: campErr } = await sb
          .from("camps")
          .select("*", { count: "exact", head: true });

        const hasServiceKey = !!(
          process.env.SUPABASE_SERVICE_KEY ||
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        return jsonResponse({
          success: true,
          data: {
            status: "ok",
            db: "connected",
            keyType: hasServiceKey
              ? "service_role (RLS bypass)"
              : "publishable / anon",
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
            system: "Coupang Fleet Sync API",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (dbError) {
        const msg =
          dbError instanceof Error ? dbError.message : "DB connection failed";
        console.error("[api/health] DB error:", dbError);
        return errorResponse(`Database unavailable: ${msg}`, 503);
      }
    }

    // Auth
    if (path === "/api/auth/login" && method === "POST") {
      return authController.login(req);
    }

    // Admins
    if (path === "/api/admins" && method === "GET") {
      return adminController.getAdmins(url);
    }
    if (path === "/api/admins" && method === "POST") {
      return adminController.createAdmin(req);
    }
    const adminMatch = path.match(/^\/api\/admins\/([^/]+)$/);
    if (adminMatch) {
      const id = parseId(adminMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 관리자 ID입니다", 400);
      if (method === "PUT") return adminController.updateAdmin(id, req);
      if (method === "DELETE") return adminController.deleteAdmin(id);
    }

    // Companies
    if (path === "/api/companies" && method === "GET") {
      return masterController.getCompanies();
    }
    if (path === "/api/companies" && method === "POST") {
      return masterController.createCompany(req);
    }
    const companyMatch = path.match(/^\/api\/companies\/([^/]+)$/);
    if (companyMatch && method === "DELETE") {
      const id = parseId(companyMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 회사 ID입니다", 400);
      return masterController.deleteCompany(id);
    }

    // Camps
    if (path === "/api/camps" && method === "GET") {
      return masterController.getCamps(url);
    }
    if (path === "/api/camps" && method === "POST") {
      return masterController.createCamp(req);
    }
    const campMatch = path.match(/^\/api\/camps\/([^/]+)$/);
    if (campMatch && method === "DELETE") {
      const id = parseId(campMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 캠프 ID입니다", 400);
      return masterController.deleteCamp(id);
    }

    // Routes
    if (path === "/api/routes" && method === "GET") {
      return masterController.getRoutes(url);
    }
    if (path === "/api/routes" && method === "POST") {
      return masterController.createRoute(req);
    }
    const routeMatch = path.match(/^\/api\/routes\/([^/]+)$/);
    if (routeMatch && method === "DELETE") {
      const id = parseId(routeMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 라우트 ID입니다", 400);
      return masterController.deleteRoute(id);
    }

    // Drivers
    if (path === "/api/drivers" && method === "GET") {
      return driverController.getDrivers(url);
    }
    if (path === "/api/drivers" && method === "POST") {
      return driverController.createDriver(req);
    }
    const driverMatch = path.match(/^\/api\/drivers\/([^/]+)$/);
    if (driverMatch) {
      const id = parseId(driverMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 기사 ID입니다", 400);
      if (method === "GET") return driverController.getDriverById(id);
      if (method === "PUT") return driverController.updateDriver(id, req);
      if (method === "DELETE") return driverController.deleteDriver(id);
    }

    // Schedules
    if (path === "/api/schedules/grid" && method === "GET") {
      return scheduleController.getScheduleGrid(url);
    }
    if (path === "/api/schedules/cell" && method === "PUT") {
      return scheduleController.updateCellStatus(req);
    }
    if (path === "/api/schedules/offdays" && method === "GET") {
      return scheduleController.getOffDaySummary(url);
    }

    // Backups
    if (path === "/api/backups" && method === "GET") {
      return backupController.getAllAssignments();
    }
    if (path === "/api/backups/candidates" && method === "GET") {
      return backupController.getCandidates(url);
    }
    if (path === "/api/backups/assign" && method === "POST") {
      return backupController.assignBackup(req);
    }

    // Monthly Rosters
    if (path === "/api/monthly-rosters" && method === "GET") {
      return monthlyRosterController.getRosters();
    }
    if (path === "/api/monthly-rosters" && method === "POST") {
      return monthlyRosterController.createRoster(req);
    }
    const rosterMatch = path.match(/^\/api\/monthly-rosters\/([^/]+)$/);
    if (rosterMatch) {
      const id = parseId(rosterMatch[1]);
      if (id === null) return errorResponse("유효하지 않은 근무표 ID입니다", 400);
      if (method === "GET") return monthlyRosterController.getRosterById(id);
      if (method === "PUT") return monthlyRosterController.updateRoster(id, req);
      if (method === "DELETE") return monthlyRosterController.deleteRoster(id);
    }

    return errorResponse("Not Found", 404);
  } catch (error: unknown) {
    console.error("[api] Request error:", { path, method, error });
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status =
      message.includes("찾을") || message.includes("삭제") ? 400 : 500;
    return errorResponse(message, status);
  }
}
