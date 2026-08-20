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
  campName?: string;
  routeName?: string;
  displayRoute?: string;
  date: string;
  backupAssigned: boolean;
  backupDriverName?: string;
}

export interface MonthlyRosterItem {
  id?: number;
  rosterId?: number;
  date: string; // '2026-08-01'
  campName: string;
  routeName: string;
  routeKey: string; // '남양주3/905CD'
  driverId?: number;
  driverName?: string;
  contractType?: string;
  status: ShiftStatus;
  backupDriverId?: number;
  backupDriverName?: string;
}

export interface MonthlyRoster {
  id: number;
  targetMonth: string; // '2026-08'
  title: string;
  memo?: string;
  status: 'draft' | 'approved' | 'archived';
  totalAssignments: number;
  createdAt: string;
  updatedAt: string;
  items?: MonthlyRosterItem[];
}

export interface CreateMonthlyRosterForm {
  targetMonth: string;
  title: string;
  memo?: string;
  status?: 'draft' | 'approved' | 'archived';
  items: MonthlyRosterItem[];
}
