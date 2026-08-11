import { BackupAssignment, AssignBackupDTO } from '../types';
import { readJsonFile, writeJsonFile, hasData } from '../database/jsonStore';
import { initialBackupAssignments } from '../database/mockData';
import { driverRepository } from './driverRepository';

const FILE_NAME = 'backups.json';

class BackupRepository {
  constructor() {
    this.seedIfEmpty();
  }

  /** 최초 실행 시 JSON 파일이 비어있으면 시드 데이터 주입 */
  private seedIfEmpty(): void {
    if (!hasData(FILE_NAME)) {
      writeJsonFile<BackupAssignment>(FILE_NAME, initialBackupAssignments);
      console.log('[BackupRepo] 시드 데이터 주입 완료 → backups.json');
    }
  }

  private load(): BackupAssignment[] {
    return readJsonFile<BackupAssignment>(FILE_NAME);
  }

  private save(assignments: BackupAssignment[]): void {
    writeJsonFile<BackupAssignment>(FILE_NAME, assignments);
  }

  public findAll(): BackupAssignment[] {
    return this.load();
  }

  public findByDateAndRoute(date: string, routeNumber: string): BackupAssignment | undefined {
    const assignments = this.load();
    return assignments.find(a => a.date === date && a.routeNumber === routeNumber);
  }

  public findByDate(date: string): BackupAssignment[] {
    const assignments = this.load();
    return assignments.filter(a => a.date === date);
  }

  public assignBackup(dto: AssignBackupDTO): BackupAssignment | null {
    const originalDriver = driverRepository.findById(dto.originalDriverId);
    const backupDriver = driverRepository.findById(dto.backupDriverId);

    if (!originalDriver || !backupDriver) {
      return null;
    }

    let assignments = this.load();

    // Remove existing assignment if any for that date & route
    assignments = assignments.filter(
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

    assignments.push(newAssignment);
    this.save(assignments);
    return newAssignment;
  }

  public removeAssignment(date: string, routeNumber: string): boolean {
    const assignments = this.load();
    const filtered = assignments.filter(
      a => !(a.date === date && a.routeNumber === routeNumber)
    );
    const removed = filtered.length < assignments.length;
    if (removed) {
      this.save(filtered);
    }
    return removed;
  }
}

export const backupRepository = new BackupRepository();
