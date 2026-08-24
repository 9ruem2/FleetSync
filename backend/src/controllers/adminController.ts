import { adminRepository } from "../repositories/dbRepository";
import { CreateAdminDTO, UpdateAdminDTO } from "../types";
import { jsonResponse, errorResponse, parseBody, parseId } from "./httpUtils";

export class AdminController {
  public async getAdmins(url: URL): Promise<Response> {
    const companyIdStr = url.searchParams.get("companyId");
    const companyId = companyIdStr ? parseId(companyIdStr) : 1;
    const data = await adminRepository.findAdminsByCompany(companyId ?? 1);
    return jsonResponse({ success: true, data });
  }

  public async createAdmin(req: Request): Promise<Response> {
    const body = await parseBody<CreateAdminDTO>(req);
    if (
      !body.companyId ||
      !body.loginId?.trim() ||
      !body.password?.trim() ||
      !body.name?.trim()
    ) {
      return errorResponse(
        "회사, 아이디, 비밀번호, 이름을 모두 입력해주세요.",
        400,
      );
    }
    const data = await adminRepository.createAdmin(body);
    return jsonResponse(
      { success: true, data, message: "관리자가 등록되었습니다." },
      201,
    );
  }

  public async updateAdmin(id: number, req: Request): Promise<Response> {
    const body = await parseBody<UpdateAdminDTO>(req);
    const data = await adminRepository.updateAdmin(id, body);
    if (!data) return errorResponse("관리자를 찾을 수 없습니다.", 404);
    return jsonResponse({
      success: true,
      data,
      message: "관리자 정보 및 권한이 수정되었습니다.",
    });
  }

  public async deleteAdmin(id: number): Promise<Response> {
    const ok = await adminRepository.deleteAdmin(id);
    return jsonResponse({
      success: ok,
      message: ok ? "관리자가 삭제되었습니다." : "삭제 실패",
    });
  }
}

export const adminController = new AdminController();
