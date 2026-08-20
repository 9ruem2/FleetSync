import { driverRepository, scheduleRepository, backupRepository } from '../repositories/dbRepository';
import { CreateDriverDTO, UpdateDriverDTO, Driver, ShiftStatus, AssignBackupDTO } from '../types';
import { normalizePhoneNumber } from '../utils/phoneFormat';
import { parseRoutes, parseCamps } from '../utils/routeUtils';

function driverMatchesRoute(driver: Driver, route: string): boolean {
  const q = route.trim().toLowerCase();
  const all = parseRoutes(driver.routes);
  return all.some(r => r.toLowerCase().includes(q));
}

class DriverService {
  public async getAllDrivers(search?: string, camp?: string, route?: string, contractType?: string): Promise<Driver[]> {
    let drivers = await driverRepository.findAll();

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      drivers = drivers.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.driverCode.toLowerCase().includes(q) ||
        (d.camp && d.camp.toLowerCase().includes(q)) ||
        String(d.id).includes(q) ||
        (d.routes && d.routes.toLowerCase().includes(q)) ||
        d.phone.includes(q) ||
        normalizePhoneNumber(d.phone).includes(q)
      );
    }

    if (camp && camp.trim() !== '') {
      const q = camp.trim().toLowerCase();
      drivers = drivers.filter(d => parseCamps(d.camp).some(c => c.toLowerCase() === q));
    }

    if (route && route.trim() !== '') {
      drivers = drivers.filter(d => driverMatchesRoute(d, route));
    }

    if (contractType && contractType.trim() !== '') {
      drivers = drivers.filter(d => d.contractType === contractType.trim());
    }

    return drivers;
  }

  public async getDriverById(id: number): Promise<Driver | null> {
    return (await driverRepository.findById(id)) || null;
  }

  private validateDriverInput(dto: CreateDriverDTO): void {
    if (!dto.name?.trim() || !dto.phone?.trim() || !dto.camp?.trim() || !dto.contractType) {
      throw new Error('필수 입력값이 누락되었습니다 (기사명, 연락처, 캠프, 계약형태)');
    }
  }

  public async createDriver(dto: CreateDriverDTO): Promise<Driver> {
    this.validateDriverInput(dto);
    return driverRepository.create({
      ...dto,
      driverCode: (dto.driverCode ?? '').trim(),
      camp: dto.camp.trim(),
      phone: normalizePhoneNumber(dto.phone),
    });
  }

  public async updateDriver(id: number, dto: UpdateDriverDTO): Promise<Driver> {
    const existing = await driverRepository.findById(id);
    if (!existing) throw new Error('해당 기사를 찾을 수 없거나 이미 삭제되었습니다');

    const merged: CreateDriverDTO = {
      driverCode: dto.driverCode ?? existing.driverCode,
      name: dto.name ?? existing.name,
      phone: dto.phone ?? existing.phone,
      camp: dto.camp ?? existing.camp,
      routes: dto.routes ?? existing.routes,
      contractType: dto.contractType ?? existing.contractType,
    };
    this.validateDriverInput(merged);

    const updated = await driverRepository.update(id, {
      ...dto,
      ...(dto.phone !== undefined ? { phone: normalizePhoneNumber(dto.phone) } : {}),
    });
    if (!updated) {
      throw new Error('해당 기사를 찾을 수 없거나 이미 삭제되었습니다');
    }
    return updated;
  }

  public async deleteDriver(id: number): Promise<boolean> {
    const success = await driverRepository.softDelete(id);
    if (!success) {
      throw new Error('기사 삭제에 실패했습니다');
    }
    return true;
  }
}

export interface GridRow {
  driverId: number;
  driverCode: string;
  driverName: string;
  phone: string;
  camp: string;
  routes: string;
  contractType: string;
  shifts: {
    [date: string]: {
      status: ShiftStatus;
      backupAssigned?: boolean;
      backupDriverId?: number;
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
        driverCode: driver.driverCode,
        driverName: driver.name,
        phone: driver.phone,
        camp: driver.camp,
        routes: driver.routes,
        contractType: driver.contractType,
        shifts: shiftMap,
      };
    });
  }

  public async updateCellStatus(driverId: number, date: string, status: ShiftStatus) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) throw new Error('기사 정보를 찾을 수 없습니다.');

    const shift = await scheduleRepository.upsertShift(driverId, date, status);

    if (status !== '휴무') {
      const activeRoutes = parseRoutes(driver.routes);
      for (const route of activeRoutes) {
        await backupRepository.removeAssignment(date, route);
      }
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
        routeNumber: driver ? driver.routes.split(',')[0] || '-' : '-',
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
