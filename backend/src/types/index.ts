export type ContractType = '고정' | '용차' | '백업';
export type ShiftStatus = '고정' | '용차' | '백업' | '휴무';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  routeNumber: string;
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
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
  name: string;
  phone: string;
  routeNumber: string;
  contractType: ContractType;
}

export interface UpdateDriverDTO {
  name?: string;
  phone?: string;
  routeNumber?: string;
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
