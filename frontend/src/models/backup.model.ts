export interface BackupAssignment {
  id: number;
  date: string;
  campName?: string;
  routeNumber: string;
  originalDriverId: number;
  originalDriverName: string;
  backupDriverId: number;
  backupDriverName: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssignBackupForm {
  date: string;
  campName?: string;
  routeNumber: string;
  originalDriverId: number;
  backupDriverId: number;
  note?: string;
}
