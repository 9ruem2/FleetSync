import { ScheduleShift, ShiftStatus } from '../types';
import { generateSeedShifts } from '../database/mockData';
import { driverRepository } from './driverRepository';

class ScheduleRepository {
  private shifts: ScheduleShift[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const drivers = driverRepository.findAll(true);
    this.shifts = generateSeedShifts(drivers);
  }

  public findShifts(startDate?: string, endDate?: string, driverId?: string): ScheduleShift[] {
    return this.shifts.filter(shift => {
      if (startDate && shift.date < startDate) return false;
      if (endDate && shift.date > endDate) return false;
      if (driverId && shift.driverId !== driverId) return false;
      return true;
    });
  }

  public findShift(driverId: string, date: string): ScheduleShift | undefined {
    return this.shifts.find(s => s.driverId === driverId && s.date === date);
  }

  public upsertShift(driverId: string, date: string, status: ShiftStatus): ScheduleShift {
    const existing = this.findShift(driverId, date);
    if (existing) {
      existing.status = status;
      return existing;
    } else {
      const newShift: ScheduleShift = {
        id: `shift-${driverId}-${date}`,
        driverId,
        date,
        status
      };
      this.shifts.push(newShift);
      return newShift;
    }
  }

  public getOffDays(startDate?: string, endDate?: string): ScheduleShift[] {
    return this.shifts.filter(shift => {
      if (shift.status !== '휴무') return false;
      if (startDate && shift.date < startDate) return false;
      if (endDate && shift.date > endDate) return false;
      return true;
    });
  }
}

export const scheduleRepository = new ScheduleRepository();
