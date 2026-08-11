import { Request, Response } from 'express';
import { driverService } from '../services/driverService';

export class DriverController {
  public static getDrivers(req: Request, res: Response): void {
    try {
      const { search, route, contractType } = req.query;
      const drivers = driverService.getAllDrivers(
        search as string,
        route as string,
        contractType as string
      );
      res.status(200).json({ success: true, data: drivers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static getDriverById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const driver = driverService.getDriverById(id);
      if (!driver) {
        res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다' });
        return;
      }
      res.status(200).json({ success: true, data: driver });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static createDriver(req: Request, res: Response): void {
    try {
      const newDriver = driverService.createDriver(req.body);
      res.status(201).json({ success: true, data: newDriver, message: '기사가 신규 등록되었습니다' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static updateDriver(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const updated = driverService.updateDriver(id, req.body);
      res.status(200).json({ success: true, data: updated, message: '기사 정보가 수정되었습니다' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static deleteDriver(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      driverService.deleteDriver(id);
      res.status(200).json({ success: true, message: '기사 정보가 소프트 삭제 처리되었습니다' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
