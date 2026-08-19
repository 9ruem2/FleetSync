export type ContractType = '고정' | '용차' | '백업';
export type ShiftStatus = '고정' | '용차' | '백업' | '휴무';
export type WeekPattern = '1,3' | '2,4' | 'both';

export interface DriverCampRouteInfo {
  campId: number;
  campName: string;
  route: string;
}

export interface Driver {
  id: number;
  driverCode: string;
  name: string;
  phone: string;
  camp: string;          // 콤마 구분 캠프 목록 (뷰 호환)
  routeNumber: string;   // 메인 라우트 (뷰/백업 호환)
  routesWeek13: string;  // 콤마 구분 라우트 목록 (뷰 호환)
  routesWeek24: string;  // 뷰 호환
  weekPattern: WeekPattern;
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
  campRoutes?: DriverCampRouteInfo[];
}

export interface ScheduleShift {
  id: number;
  driverId: number;
  date: string;
  status: ShiftStatus;
}

export interface BackupAssignment {
  id: number;
  date: string;
  routeNumber: string;
  originalDriverId: number;
  originalDriverName: string;
  backupDriverId: number;
  backupDriverName: string;
  note?: string;
  createdAt: string;
}

export interface OffDayRecord {
  id: number;
  driverId: number;
  driverName: string;
  routeNumber: string;
  date: string;
  backupAssigned: boolean;
  backupDriverName?: string;
}

export interface CreateDriverDTO {
  driverCode?: string;
  name: string;
  phone: string;
  camp: string;     // 콤마 구분 캠프 목록
  routes: string;   // 콤마 구분 라우트 목록 (camp와 1:1)
  contractType: ContractType;
}

export interface UpdateDriverDTO {
  driverCode?: string;
  name?: string;
  phone?: string;
  camp?: string;
  routes?: string;
  contractType?: ContractType;
}

export interface UpdateShiftStatusDTO {
  driverId: number;
  date: string;
  status: ShiftStatus;
}

export interface AssignBackupDTO {
  date: string;
  routeNumber: string;
  originalDriverId: number;
  backupDriverId: number;
  note?: string;
}

export interface QuickOffDayDTO {
  driverId: number;
  date: string;
}
