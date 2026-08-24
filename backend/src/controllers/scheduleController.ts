import { scheduleService } from "../services/index";
import { UpdateShiftStatusDTO } from "../types";
import { jsonResponse, errorResponse, parseBody } from "./httpUtils";

export class ScheduleController {
  public async getScheduleGrid(url: URL): Promise<Response> {
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const camps = url.searchParams.get("camps") ?? undefined;
    if (!startDate || !endDate) {
      return errorResponse("startDate와 endDate 조회가 필요합니다", 400);
    }
    try {
      const grid = await scheduleService.getScheduleGrid(
        startDate,
        endDate,
        camps,
      );
      return jsonResponse({ success: true, data: grid });
    } catch (err: any) {
      console.error("[GET /api/schedules/grid error]:", err);
      return errorResponse(err.message || "스케줄 그리드 조회 실패", 500);
    }
  }

  public async updateCellStatus(req: Request): Promise<Response> {
    const body = await parseBody<UpdateShiftStatusDTO>(req);
    if (!body.driverId || !body.date || !body.status) {
      return errorResponse("driverId, date, status 정보가 필수입니다", 400);
    }
    try {
      const shift = await scheduleService.updateCellStatus(
        body.driverId,
        body.date,
        body.status,
      );
      return jsonResponse({
        success: true,
        data: shift,
        message: "근무 상태가 수정되었습니다",
      });
    } catch (err: any) {
      return errorResponse(err.message || "근무 상태 수정 실패", 400);
    }
  }

  public async getOffDaySummary(url: URL): Promise<Response> {
    try {
      const offDays = await scheduleService.getOffDaySummary(
        url.searchParams.get("startDate") ?? undefined,
        url.searchParams.get("endDate") ?? undefined,
      );
      return jsonResponse({ success: true, data: offDays });
    } catch (err: any) {
      return errorResponse(err.message || "휴무 목록 조회 실패", 500);
    }
  }
}

export const scheduleController = new ScheduleController();
