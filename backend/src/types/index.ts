export type ContractType = '고정' | '용차' | '백업';
export type ShiftStatus = '고정' | '용차' | '백업' | '휴무';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  routeNumber: string; // e.g. "101A", "102B"
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean; // Soft delete support
}

export interface ScheduleShift {
  id: string;
  driverId: string;
  date: string; // "YYYY-MM-DD"
  status: ShiftStatus;
}

export interface BackupAssignment {
  id: string;
  date: string; // "YYYY-MM-DD"
  routeNumber: string;
  originalDriverId: string;
  originalDriverName: string;
  backupDriverId: string;
  backupDriverName: string;
  note?: string;
  createdAt: string;
}

export interface OffDayRecord {
  id: string;
  driverId: string;
  driverName: string;
  routeNumber: string;
  date: string; // "YYYY-MM-DD"
  backupAssigned: boolean;
  backupDriverName?: string;
}

// Request DTOs
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
  driverId: string;
  date: string;
  status: ShiftStatus;
}

export interface AssignBackupDTO {
  date: string;
  routeNumber: string;
  originalDriverId: string;
  backupDriverId: string;
  note?: string;
}

export interface QuickOffDayDTO {
  driverId: string;
  date: string;
}
