export type ShiftStatus = '고정' | '용차' | '백업' | '휴무';

export interface GridShiftCell {
  status: ShiftStatus;
  backupAssigned?: boolean;
  backupDriverId?: number;
  backupDriverName?: string;
}

export interface ScheduleGridRow {
  driverId: number;
  driverCode: string;
  driverName: string;
  phone: string;
  camp: string;
  routes: string;
  contractType: string;
  shifts: {
    [date: string]: GridShiftCell;
  };
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
