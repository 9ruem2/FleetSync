import { backupRepository } from '../repositories/backupRepository';
import { driverRepository } from '../repositories/driverRepository';
import { scheduleRepository } from '../repositories/scheduleRepository';
import { AssignBackupDTO } from '../types';

class BackupService {
  public getAllAssignments() {
    return backupRepository.findAll();
  }

  public getAvailableBackupDrivers(date: string) {
    const drivers = driverRepository.findAll();
    const shiftsOnDate = scheduleRepository.findShifts(date, date);
    
    // Find drivers who are marked as '휴무' on that date
    const offDriverIds = new Set(
      shiftsOnDate.filter(s => s.status === '휴무').map(s => s.driverId)
    );

    // Eligible backup drivers:
    // 1. Contract type is '백업' OR available drivers
    // 2. Not marked as '휴무' on that date
    return drivers.filter(d => !offDriverIds.has(d.id));
  }

  public assignBackup(dto: AssignBackupDTO) {
    if (!dto.date || !dto.routeNumber || !dto.originalDriverId || !dto.backupDriverId) {
      throw new Error('필수 정보가 누락되었습니다 (날짜, 라우트, 기존기사, 백업기사)');
    }

    const assignment = backupRepository.assignBackup(dto);
    if (!assignment) {
      throw new Error('대차 지정에 실패했습니다.');
    }

    return assignment;
  }
}

export const backupService = new BackupService();
