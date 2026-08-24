import { monthlyRosterRepository } from "../repositories/dbRepository";
import { jsonResponse, errorResponse, parseBody, parseId } from "./httpUtils";

export class MonthlyRosterController {
  public async getRosters(): Promise<Response> {
    try {
      const rosters = await monthlyRosterRepository.findAll();
      return jsonResponse({ success: true, data: rosters });
    } catch (err: any) {
      return errorResponse(err.message || "월별 근무표 목록 조회 실패", 500);
    }
  }

  public async getRosterById(id: number): Promise<Response> {
    try {
      const roster = await monthlyRosterRepository.findById(id);
      if (!roster) {
        return errorResponse("해당 월별 근무표를 찾을 수 없습니다", 404);
      }
      return jsonResponse({ success: true, data: roster });
    } catch (err: any) {
      return errorResponse(err.message || "월별 근무표 조회 실패", 500);
    }
  }

  public async createRoster(req: Request): Promise<Response> {
    try {
      const body = await parseBody<any>(req);
      if (!body.targetMonth || !body.title || !Array.isArray(body.items)) {
        return errorResponse(
          "targetMonth, title, items 목록이 필수입니다",
          400,
        );
      }
      const created = await monthlyRosterRepository.create(body);
      return jsonResponse(
        {
          success: true,
          data: created,
          message: "월별 근무표가 DB에 성공적으로 저장되었습니다",
        },
        201,
      );
    } catch (err: any) {
      return errorResponse(err.message || "월별 근무표 저장 실패", 500);
    }
  }

  public async updateRoster(id: number, req: Request): Promise<Response> {
    try {
      const body = await parseBody<any>(req);
      const updated = await monthlyRosterRepository.update(id, body);
      if (!updated) {
        return errorResponse("해당 월별 근무표를 찾을 수 없습니다", 404);
      }
      return jsonResponse({
        success: true,
        data: updated,
        message: "월별 근무표가 수정되었습니다",
      });
    } catch (err: any) {
      return errorResponse(err.message || "월별 근무표 수정 실패", 500);
    }
  }

  public async deleteRoster(id: number): Promise<Response> {
    try {
      const deleted = await monthlyRosterRepository.delete(id);
      return jsonResponse({
        success: true,
        data: { id, deleted },
        message: "월별 근무표가 삭제되었습니다",
      });
    } catch (err: any) {
      return errorResponse(err.message || "월별 근무표 삭제 실패", 500);
    }
  }
}

export const monthlyRosterController = new MonthlyRosterController();
