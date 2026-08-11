import { ScheduleShift, ShiftStatus } from '../types';
import { readJsonFile, writeJsonFile, hasData } from '../database/jsonStore';
import { generateSeedShifts } from '../database/mockData';
import { driverRepository } from './driverRepository';

const FILE_NAME = 'schedules.json';

class ScheduleRepository {
  constructor() {
    this.seedIfEmpty();
  }

  /** 최초 실행 시 JSON 파일이 비어있으면 시드 데이터 주입 */
  private seedIfEmpty(): void {
    if (!hasData(FILE_NAME)) {
      const drivers = driverRepository.findAll(true);
      const seeds = generateSeedShifts(drivers);
      writeJsonFile<ScheduleShift>(FILE_NAME, seeds);
      console.log(`[ScheduleRepo] 시드 데이터 주입 완료 → ${FILE_NAME} (${seeds.length}건)`);
    }
  }

  private load(): ScheduleShift[] {
    return readJsonFile<ScheduleShift>(FILE_NAME);
  }

  private save(shifts: ScheduleShift[]): void {
    writeJsonFile<ScheduleShift>(FILE_NAME, shifts);
  }

  public findShifts(startDate?: string, endDate?: string, driverId?: string): ScheduleShift[] {
    const shifts = this.load();
    return shifts.filter(shift => {
      if (startDate && shift.date < startDate) return false;
      if (endDate && shift.date > endDate) return false;
      if (driverId && shift.driverId !== driverId) return false;
      return true;
    });
  }

  public findShift(driverId: string, date: string): ScheduleShift | undefined {
    const shifts = this.load();
    return shifts.find(s => s.driverId === driverId && s.date === date);
  }

  public upsertShift(driverId: string, date: string, status: ShiftStatus): ScheduleShift {
    const shifts = this.load();
    const existingIndex = shifts.findIndex(s => s.driverId === driverId && s.date === date);

    if (existingIndex !== -1) {
      shifts[existingIndex].status = status;
      this.save(shifts);
      return shifts[existingIndex];
    } else {
      const newShift: ScheduleShift = {
        id: `shift-${driverId}-${date}`,
        driverId,
        date,
        status
      };
      shifts.push(newShift);
      this.save(shifts);
      return newShift;
    }
  }

  public getOffDays(startDate?: string, endDate?: string): ScheduleShift[] {
    const shifts = this.load();
    return shifts.filter(shift => {
      if (shift.status !== '휴무') return false;
      if (startDate && shift.date < startDate) return false;
      if (endDate && shift.date > endDate) return false;
      return true;
    });
  }
}

export const scheduleRepository = new ScheduleRepository();
