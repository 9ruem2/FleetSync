import { adminRepository } from "../repositories/dbRepository";
import { jsonResponse, errorResponse, parseBody } from "./httpUtils";

export class AuthController {
  public async login(req: Request): Promise<Response> {
    const body = await parseBody<{
      companyCode?: string;
      loginId?: string;
      userId?: string;
      password?: string;
    }>(req);
    const companyCode = (body.companyCode || "").trim();
    const loginId = (body.loginId || body.userId || "").trim();
    const password = (body.password || "").trim();

    if (!companyCode) {
      return errorResponse("회사 코드를 입력해주세요.", 400);
    }
    if (!loginId) {
      return errorResponse("아이디를 입력해주세요.", 400);
    }
    if (!password) {
      return errorResponse("비밀번호를 입력해주세요.", 400);
    }

    try {
      const loginResult = await adminRepository.findAdminByCredentials(
        companyCode,
        loginId,
        password,
      );

      return jsonResponse({
        success: true,
        data: loginResult,
      });
    } catch (err: any) {
      return errorResponse(err.message || "로그인에 실패하였습니다.", 401);
    }
  }
}

export const authController = new AuthController();
