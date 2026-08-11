import { BackupAssignment, AssignBackupDTO } from '../types';
import { initialBackupAssignments } from '../database/mockData';
import { driverRepository } from './driverRepository';

class BackupRepository {
  private assignments: BackupAssignment[] = [...initialBackupAssignments];

  public findAll(): BackupAssignment[] {
    return this.assignments;
  }

  public findByDateAndRoute(date: string, routeNumber: string): BackupAssignment | undefined {
    return this.assignments.find(a => a.date === date && a.routeNumber === routeNumber);
  }

  public findByDate(date: string): BackupAssignment[] {
    return this.assignments.filter(a => a.date === date);
  }

  public assignBackup(dto: AssignBackupDTO): BackupAssignment | null {
    const originalDriver = driverRepository.findById(dto.originalDriverId);
    const backupDriver = driverRepository.findById(dto.backupDriverId);

    if (!originalDriver || !backupDriver) {
      return null;
    }

    // Remove existing assignment if any for that date & route
    this.assignments = this.assignments.filter(
      a => !(a.date === dto.date && a.routeNumber === dto.routeNumber)
    );

    const newAssignment: BackupAssignment = {
      id: `bak-${Date.now()}`,
      date: dto.date,
      routeNumber: dto.routeNumber,
      originalDriverId: originalDriver.id,
      originalDriverName: originalDriver.name,
      backupDriverId: backupDriver.id,
      backupDriverName: backupDriver.name,
      note: dto.note || '수동 지정 완료',
      createdAt: new Date().toISOString()
    };

    this.assignments.push(newAssignment);
    return newAssignment;
  }

  public removeAssignment(date: string, routeNumber: string): boolean {
    const initialLen = this.assignments.length;
    this.assignments = this.assignments.filter(
      a => !(a.date === date && a.routeNumber === routeNumber)
    );
    return this.assignments.length < initialLen;
  }
}

export const backupRepository = new BackupRepository();
