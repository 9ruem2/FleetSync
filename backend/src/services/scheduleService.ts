import { scheduleRepository } from '../repositories/scheduleRepository';
import { driverRepository } from '../repositories/driverRepository';
import { backupRepository } from '../repositories/backupRepository';
import { ShiftStatus } from '../types';

export interface GridRow {
  driverId: string;
  driverName: string;
  routeNumber: string;
  contractType: string;
  shifts: {
    [date: string]: {
      status: ShiftStatus;
      backupAssigned?: boolean;
      backupDriverId?: string;
      backupDriverName?: string;
    };
  };
}

class ScheduleService {
  public getScheduleGrid(startDate: string, endDate: string) {
    const drivers = driverRepository.findAll();
    const shifts = scheduleRepository.findShifts(startDate, endDate);
    const backupAssignments = backupRepository.findAll();

    const backupMap = new Map<string, any>();
    backupAssignments.forEach(b => {
      // Key: "date_routeNumber" or "date_originalDriverId"
      backupMap.set(`${b.date}_${b.originalDriverId}`, b);
    });

    const gridRows: GridRow[] = drivers.map(driver => {
      const driverShifts = shifts.filter(s => s.driverId === driver.id);
      const shiftMap: GridRow['shifts'] = {};

      driverShifts.forEach(shift => {
        const backupInfo = backupMap.get(`${shift.date}_${driver.id}`);
        shiftMap[shift.date] = {
          status: shift.status,
          backupAssigned: !!backupInfo,
          backupDriverId: backupInfo?.backupDriverId,
          backupDriverName: backupInfo?.backupDriverName
        };
      });

      return {
        driverId: driver.id,
        driverName: driver.name,
        routeNumber: driver.routeNumber,
        contractType: driver.contractType,
        shifts: shiftMap
      };
    });

    return gridRows;
  }

  public updateCellStatus(driverId: string, date: string, status: ShiftStatus) {
    const driver = driverRepository.findById(driverId);
    if (!driver) throw new Error('기사 정보를 찾을 수 없습니다.');

    const shift = scheduleRepository.upsertShift(driverId, date, status);

    // If status changed from '휴무' to something else, clear backup assignment if any
    if (status !== '휴무') {
      backupRepository.removeAssignment(date, driver.routeNumber);
    }

    return shift;
  }

  public getOffDaySummary(startDate?: string, endDate?: string) {
    const offDayShifts = scheduleRepository.getOffDays(startDate, endDate);
    const drivers = driverRepository.findAll();
    const backupAssignments = backupRepository.findAll();

    const driverMap = new Map(drivers.map(d => [d.id, d]));
    const backupMap = new Map(backupAssignments.map(b => [`${b.date}_${b.originalDriverId}`, b]));

    return offDayShifts.map(shift => {
      const driver = driverMap.get(shift.driverId);
      const backup = backupMap.get(`${shift.date}_${shift.driverId}`);

      return {
        id: shift.id,
        driverId: shift.driverId,
        driverName: driver ? driver.name : '미상',
        routeNumber: driver ? driver.routeNumber : '-',
        date: shift.date,
        backupAssigned: !!backup,
        backupDriverId: backup?.backupDriverId,
        backupDriverName: backup?.backupDriverName
      };
    });
  }
}

export const scheduleService = new ScheduleService();
