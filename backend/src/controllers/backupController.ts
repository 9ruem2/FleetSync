import { Request, Response } from 'express';
import { backupService } from '../services/backupService';

export class BackupController {
  public static getAllAssignments(_req: Request, res: Response): void {
    try {
      const assignments = backupService.getAllAssignments();
      res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static getCandidates(req: Request, res: Response): void {
    try {
      const { date } = req.query;
      if (!date) {
        res.status(400).json({ success: false, message: '조회 기준 날짜(date)가 필요합니다' });
        return;
      }
      const candidates = backupService.getAvailableBackupDrivers(date as string);
      res.status(200).json({ success: true, data: candidates });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static assignBackup(req: Request, res: Response): void {
    try {
      const assignment = backupService.assignBackup(req.body);
      res.status(201).json({ success: true, data: assignment, message: '대차 기사가 지정되었습니다' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
