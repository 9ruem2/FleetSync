export interface BackupAssignment {
  id: string;
  date: string;
  routeNumber: string;
  originalDriverId: string;
  originalDriverName: string;
  backupDriverId: string;
  backupDriverName: string;
  note?: string;
  createdAt: string;
}

export interface AssignBackupForm {
  date: string;
  routeNumber: string;
  originalDriverId: string;
  backupDriverId: string;
  note?: string;
}
