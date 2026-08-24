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
  public async getAllDrivers(
    search?: string,
    camp?: string,
    route?: string,
    contractType?: string,
    camps?: string, // 쉼표 구분 다중 캠프 필터
  ): Promise<Driver[]> {
    let drivers = await driverRepository.findAll();

    if (camps && camps.trim() !== '') {
      const allowedCamps = camps
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);
      if (allowedCamps.length > 0) {
        drivers = drivers.filter(d =>
          parseCamps(d.camp).some(c => allowedCamps.includes(c.toLowerCase()))
        );
      }
    }

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

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export function isDateMatchingFixedHoliday(
  dateStr: string,
  weekCycle: string,
  dayOfWeek: string,
): boolean {
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return false;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayName = DAY_NAMES[date.getDay()];

    // 요일 검사 (쉼표로 구분된 복수 요일 지원, 예: '월,수,금')
    const targetDays = (dayOfWeek || '')
      .split(',')
      .map(s => s.replace('요일', '').trim())
      .filter(Boolean);

    if (!targetDays.includes(dayName)) {
      return false;
    }

    // 주차 검사 (해당 월의 N번째 해당 요일)
    const dayNumber = date.getDate();
    const weekNum = Math.ceil(dayNumber / 7);

    const cycle = weekCycle.replace(/\s+/g, '');
    if (cycle === '매주') {
      return true;
    } else if (cycle === '1,3주' || cycle === '1,3') {
      return weekNum === 1 || weekNum === 3 || weekNum === 5;
    } else if (cycle === '2,4주' || cycle === '2,4') {
      return weekNum === 2 || weekNum === 4;
    } else if (cycle === '1주') {
      return weekNum === 1;
    } else if (cycle === '2주') {
      return weekNum === 2;
    } else if (cycle === '3주') {
      return weekNum === 3;
    } else if (cycle === '4주') {
      return weekNum === 4;
    } else if (cycle === '5주') {
      return weekNum === 5;
    }
    return false;
  } catch {
    return false;
  }
}

class ScheduleService {
  public async getScheduleGrid(
    startDate: string,
    endDate: string,
    camps?: string,
  ): Promise<GridRow[]> {
    let drivers = await driverRepository.findAll();

    if (camps && camps.trim() !== '') {
      const allowedCamps = camps
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);
      if (allowedCamps.length > 0) {
        drivers = drivers.filter(d =>
          parseCamps(d.camp).some(c => allowedCamps.includes(c.toLowerCase()))
        );
      }
    }

    const shifts = await scheduleRepository.findShifts(startDate, endDate);
    const backupAssignments = await backupRepository.findAll();

    const backupMap = new Map<string, typeof backupAssignments[0]>();
    backupAssignments.forEach(b => {
      backupMap.set(`${b.date}_${b.originalDriverId}`, b);
    });

    // 날짜 범위 리스트 생성
    const dateList: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dateList.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }

    return drivers.map(driver => {
      const driverShifts = shifts.filter(s => s.driverId === driver.id);
      const shiftMap: GridRow['shifts'] = {};

      // 1. 기사의 고정 휴무 패턴 적용
      if (driver.fixedHolidays && driver.fixedHolidays.length > 0) {
        dateList.forEach(dStr => {
          const isFixedHoliday = driver.fixedHolidays!.some(h =>
            isDateMatchingFixedHoliday(dStr, h.weekCycle, h.dayOfWeek)
          );
          if (isFixedHoliday) {
            const backupInfo = backupMap.get(`${dStr}_${driver.id}`);
            shiftMap[dStr] = {
              status: '휴무',
              backupAssigned: !!backupInfo,
              backupDriverId: backupInfo?.backupDriverId,
              backupDriverName: backupInfo?.backupDriverName,
            };
          }
        });
      }

      // 2. 수동 저장된 스케줄 시프트가 고정 휴무를 덮어씀
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

    const offDayRecordsMap = new Map<string, any>();

    // 1. 수동 등록된 휴무 추가
    offDayShifts.forEach(shift => {
      const driver = driverMap.get(shift.driverId);
      const backup = backupMap.get(`${shift.date}_${shift.driverId}`);
      offDayRecordsMap.set(`${shift.date}_${shift.driverId}`, {
        id: shift.id,
        driverId: shift.driverId,
        driverName: driver ? driver.name : '미상',
        routeNumber: driver ? driver.routes.split(',')[0] || '-' : '-',
        date: shift.date,
        backupAssigned: !!backup,
        backupDriverId: backup?.backupDriverId,
        backupDriverName: backup?.backupDriverName,
      });
    });

    // 2. 날짜 범위가 있을 경우 고정 휴무 기사들도 자동 반영
    if (startDate && endDate) {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;

        drivers.forEach(driver => {
          if (driver.fixedHolidays && driver.fixedHolidays.length > 0) {
            const isFixed = driver.fixedHolidays.some(h =>
              isDateMatchingFixedHoliday(dStr, h.weekCycle, h.dayOfWeek)
            );
            if (isFixed) {
              const key = `${dStr}_${driver.id}`;
              if (!offDayRecordsMap.has(key)) {
                const backup = backupMap.get(key);
                offDayRecordsMap.set(key, {
                  id: driver.id * 10000 + Math.abs(dStr.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 1000),
                  driverId: driver.id,
                  driverName: driver.name,
                  routeNumber: driver.routes.split(',')[0] || '-',
                  date: dStr,
                  backupAssigned: !!backup,
                  backupDriverId: backup?.backupDriverId,
                  backupDriverName: backup?.backupDriverName,
                });
              }
            }
          }
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    return Array.from(offDayRecordsMap.values());
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
