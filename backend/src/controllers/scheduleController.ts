import { Request, Response } from 'express';
import { scheduleService } from '../services/scheduleService';

export class ScheduleController {
  public static getGrid(req: Request, res: Response): void {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'startDate와 endDate 조회가 필요합니다' });
        return;
      }
      const grid = scheduleService.getScheduleGrid(startDate as string, endDate as string);
      res.status(200).json({ success: true, data: grid });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static updateCell(req: Request, res: Response): void {
    try {
      const { driverId, date, status } = req.body;
      if (!driverId || !date || !status) {
        res.status(400).json({ success: false, message: 'driverId, date, status 정보가 필수입니다' });
        return;
      }
      const shift = scheduleService.updateCellStatus(driverId, date, status);
      res.status(200).json({ success: true, data: shift, message: '근무 상태가 수정되었습니다' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static getOffDays(req: Request, res: Response): void {
    try {
      const { startDate, endDate } = req.query;
      const offDays = scheduleService.getOffDaySummary(startDate as string, endDate as string);
      res.status(200).json({ success: true, data: offDays });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
