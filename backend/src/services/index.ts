import { driverRepository, scheduleRepository, backupRepository } from '../repositories/dbRepository';
import { CreateDriverDTO, UpdateDriverDTO, Driver, ShiftStatus, AssignBackupDTO } from '../types';

class DriverService {
  public async getAllDrivers(search?: string, route?: string, contractType?: string): Promise<Driver[]> {
    let drivers = await driverRepository.findAll();

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      drivers = drivers.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.routeNumber.toLowerCase().includes(q) ||
        d.phone.includes(q)
      );
    }

    if (route && route.trim() !== '') {
      drivers = drivers.filter(d => d.routeNumber === route.trim());
    }

    if (contractType && contractType.trim() !== '') {
      drivers = drivers.filter(d => d.contractType === contractType.trim());
    }

    return drivers;
  }

  public async getDriverById(id: string): Promise<Driver | null> {
    return (await driverRepository.findById(id)) || null;
  }

  public async createDriver(dto: CreateDriverDTO): Promise<Driver> {
    if (!dto.name || !dto.phone || !dto.routeNumber || !dto.contractType) {
      throw new Error('필수 입력값이 누락되었습니다 (기사명, 연락처, 라우트번호, 계약형태)');
    }
    return driverRepository.create(dto);
  }

  public async updateDriver(id: string, dto: UpdateDriverDTO): Promise<Driver> {
    const updated = await driverRepository.update(id, dto);
    if (!updated) {
      throw new Error('해당 기사를 찾을 수 없거나 이미 삭제되었습니다');
    }
    return updated;
  }

  public async deleteDriver(id: string): Promise<boolean> {
    const success = await driverRepository.softDelete(id);
    if (!success) {
      throw new Error('기사 삭제에 실패했습니다');
    }
    return true;
  }
}

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
  public async getScheduleGrid(startDate: string, endDate: string): Promise<GridRow[]> {
    const drivers = await driverRepository.findAll();
    const shifts = await scheduleRepository.findShifts(startDate, endDate);
    const backupAssignments = await backupRepository.findAll();

    const backupMap = new Map<string, typeof backupAssignments[0]>();
    backupAssignments.forEach(b => {
      backupMap.set(`${b.date}_${b.originalDriverId}`, b);
    });

    return drivers.map(driver => {
      const driverShifts = shifts.filter(s => s.driverId === driver.id);
      const shiftMap: GridRow['shifts'] = {};

      driverShifts.forEach(shift => {
        const backupInfo = backupMap.get(`${shift.date}_${driver.id}`);
        shiftMap[shift.date] = {
          status: shift.status,
          backupAssigned: !!backupInfo,
          backupDriverId: backupInfo?.backupDriverId,
          backupDriverName: backupInfo?.backupDriverName,
        };
      });

      return {
        driverId: driver.id,
        driverName: driver.name,
        routeNumber: driver.routeNumber,
        contractType: driver.contractType,
        shifts: shiftMap,
      };
    });
  }

  public async updateCellStatus(driverId: string, date: string, status: ShiftStatus) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) throw new Error('기사 정보를 찾을 수 없습니다.');

    const shift = await scheduleRepository.upsertShift(driverId, date, status);

    if (status !== '휴무') {
      await backupRepository.removeAssignment(date, driver.routeNumber);
    }

    return shift;
  }

  public async getOffDaySummary(startDate?: string, endDate?: string) {
    const offDayShifts = await scheduleRepository.getOffDays(startDate, endDate);
    const drivers = await driverRepository.findAll();
    const backupAssignments = await backupRepository.findAll();

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
        backupDriverName: backup?.backupDriverName,
      };
    });
  }
}

class BackupService {
  public async getAllAssignments() {
    return backupRepository.findAll();
  }

  public async getAvailableBackupDrivers(date: string) {
    const drivers = await driverRepository.findAll();
    const shiftsOnDate = await scheduleRepository.findShifts(date, date);

    const offDriverIds = new Set(
      shiftsOnDate.filter(s => s.status === '휴무').map(s => s.driverId)
    );

    return drivers.filter(d => !offDriverIds.has(d.id));
  }

  public async assignBackup(dto: AssignBackupDTO) {
    if (!dto.date || !dto.routeNumber || !dto.originalDriverId || !dto.backupDriverId) {
      throw new Error('필수 정보가 누락되었습니다 (날짜, 라우트, 기존기사, 백업기사)');
    }

    const assignment = await backupRepository.assignBackup(dto);
    if (!assignment) {
      throw new Error('대차 지정에 실패했습니다.');
    }

    return assignment;
  }
}

export const driverService = new DriverService();
export const scheduleService = new ScheduleService();
export const backupService = new BackupService();
