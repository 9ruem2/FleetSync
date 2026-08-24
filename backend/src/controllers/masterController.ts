import { masterRepository } from "../repositories/dbRepository";
import { jsonResponse, errorResponse, parseBody, parseId } from "./httpUtils";

export class MasterController {
  // Companies
  public async getCompanies(): Promise<Response> {
    try {
      const data = await masterRepository.findAllCompanies();
      return jsonResponse({ success: true, data });
    } catch (err) {
      console.error("[GET /api/companies] error fallback:", err);
      return jsonResponse({ success: true, data: [] });
    }
  }

  public async createCompany(req: Request): Promise<Response> {
    const body = await parseBody<{ name: string }>(req);
    if (!body.name?.trim()) {
      return errorResponse("회사명을 입력해주세요", 400);
    }
    const data = await masterRepository.createCompany(body.name);
    return jsonResponse(
      { success: true, data, message: "회사가 생성되었습니다" },
      201,
    );
  }

  public async deleteCompany(id: number): Promise<Response> {
    await masterRepository.deleteCompany(id);
    return jsonResponse({ success: true, message: "회사가 삭제되었습니다" });
  }

  // Camps
  public async getCamps(url: URL): Promise<Response> {
    const companyIdStr = url.searchParams.get("companyId");
    const companyId = companyIdStr ? parseId(companyIdStr) : null;
    const data =
      companyId !== null
        ? await masterRepository.findCampsByCompany(companyId)
        : await masterRepository.findAllCamps();
    return jsonResponse({ success: true, data });
  }

  public async createCamp(req: Request): Promise<Response> {
    const body = await parseBody<{ companyId: number; name: string }>(req);
    if (!body.name?.trim()) {
      return errorResponse("캠프명을 입력해주세요", 400);
    }
    const data = await masterRepository.createCamp(body.companyId, body.name);
    return jsonResponse(
      { success: true, data, message: "캠프가 생성되었습니다" },
      201,
    );
  }

  public async deleteCamp(id: number): Promise<Response> {
    await masterRepository.deleteCamp(id);
    return jsonResponse({ success: true, message: "캠프가 삭제되었습니다" });
  }

  // Routes
  public async getRoutes(url: URL): Promise<Response> {
    const campIdStr = url.searchParams.get("campId");
    const campId = campIdStr ? parseId(campIdStr) : null;
    const data =
      campId !== null
        ? await masterRepository.findRoutesByCamp(campId)
        : await masterRepository.findAllRoutes();
    return jsonResponse({ success: true, data });
  }

  public async createRoute(req: Request): Promise<Response> {
    const body = await parseBody<{ campId: number; name: string }>(req);
    if (!body.campId || !body.name?.trim()) {
      return errorResponse("campId와 라우터명을 입력해주세요", 400);
    }
    try {
      const data = await masterRepository.createRoute(body.campId, body.name);
      return jsonResponse(
        { success: true, data, message: "라우터가 생성되었습니다" },
        201,
      );
    } catch (err: any) {
      return errorResponse(err.message || "라우터 등록 실패", 400);
    }
  }

  public async deleteRoute(id: number): Promise<Response> {
    await masterRepository.deleteRoute(id);
    return jsonResponse({ success: true, message: "라우트가 삭제되었습니다" });
  }
}

export const masterController = new MasterController();
