import { driverService } from "../services/index";
import { CreateDriverDTO, UpdateDriverDTO } from "../types";
import { jsonResponse, errorResponse, parseBody } from "./httpUtils";

export class DriverController {
  public async getDrivers(url: URL): Promise<Response> {
    const drivers = await driverService.getAllDrivers(
      url.searchParams.get("search") ?? undefined,
      url.searchParams.get("camp") ?? undefined,
      url.searchParams.get("route") ?? undefined,
      url.searchParams.get("contractType") ?? undefined,
      url.searchParams.get("camps") ?? undefined,
    );
    return jsonResponse({ success: true, data: drivers });
  }

  public async getDriverById(id: number): Promise<Response> {
    const driver = await driverService.getDriverById(id);
    if (!driver) return errorResponse("기사를 찾을 수 없습니다", 404);
    return jsonResponse({ success: true, data: driver });
  }

  public async createDriver(req: Request): Promise<Response> {
    const body = await parseBody<CreateDriverDTO>(req);
    const newDriver = await driverService.createDriver(body);
    return jsonResponse(
      {
        success: true,
        data: newDriver,
        message: "기사가 신규 등록되었습니다",
      },
      201,
    );
  }

  public async updateDriver(id: number, req: Request): Promise<Response> {
    const body = await parseBody<UpdateDriverDTO>(req);
    const updated = await driverService.updateDriver(id, body);
    return jsonResponse({
      success: true,
      data: updated,
      message: "기사 정보가 수정되었습니다",
    });
  }

  public async deleteDriver(id: number): Promise<Response> {
    await driverService.deleteDriver(id);
    return jsonResponse({
      success: true,
      message: "기사 정보가 소프트 삭제 처리되었습니다",
    });
  }
}

export const driverController = new DriverController();
