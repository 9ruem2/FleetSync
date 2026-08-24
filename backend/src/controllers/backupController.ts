import { backupService } from "../services/index";
import { AssignBackupDTO } from "../types";
import { jsonResponse, errorResponse, parseBody } from "./httpUtils";

export class BackupController {
  public async getAllAssignments(): Promise<Response> {
    try {
      const assignments = await backupService.getAllAssignments();
      return jsonResponse({ success: true, data: assignments });
    } catch (err: any) {
      return errorResponse(err.message || "백업 지정 목록 조회 실패", 500);
    }
  }

  public async getCandidates(url: URL): Promise<Response> {
    const date = url.searchParams.get("date");
    if (!date) return errorResponse("조회 기준 날짜(date)가 필요합니다", 400);
    try {
      const candidates = await backupService.getAvailableBackupDrivers(date);
      return jsonResponse({ success: true, data: candidates });
    } catch (err: any) {
      return errorResponse(err.message || "백업 후보 조회 실패", 500);
    }
  }

  public async assignBackup(req: Request): Promise<Response> {
    const body = await parseBody<AssignBackupDTO>(req);
    const assignment = await backupService.assignBackup(body);
    return jsonResponse(
      {
        success: true,
        data: assignment,
        message: "대차 기사가 지정되었습니다",
      },
      201,
    );
  }
}

export const backupController = new BackupController();
