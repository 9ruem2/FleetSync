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

export interface AssignBackupForm {
  date: string;
  routeNumber: string;
  originalDriverId: number;
  backupDriverId: number;
  note?: string;
}
