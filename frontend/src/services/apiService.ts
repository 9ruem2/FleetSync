import { Driver, CreateDriverForm, UpdateDriverForm } from '../models/driver.model';
import { ScheduleGridRow, ShiftStatus, OffDayRecord } from '../models/schedule.model';
import { BackupAssignment, AssignBackupForm } from '../models/backup.model';

const API_BASE = '/api';

export class ApiService {
  // Driver Management API [F-01]
  public static async getDrivers(search?: string, route?: string, contractType?: string): Promise<Driver[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (route) params.append('route', route);
    if (contractType) params.append('contractType', contractType);

    const res = await fetch(`${API_BASE}/drivers?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createDriver(form: CreateDriverForm): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async updateDriver(id: number, form: UpdateDriverForm): Promise<Driver> {
    const res = await fetch(`${API_BASE}/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteDriver(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/drivers/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  }

  // Schedule Grid API [F-02-1]
  public static async getScheduleGrid(startDate: string, endDate: string): Promise<ScheduleGridRow[]> {
    const res = await fetch(`${API_BASE}/schedules/grid?startDate=${startDate}&endDate=${endDate}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async updateShiftCell(driverId: number, date: string, status: ShiftStatus): Promise<void> {
    const res = await fetch(`${API_BASE}/schedules/cell`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, date, status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  // Vacation / Off-day API [F-02-2]
  public static async getOffDays(startDate?: string, endDate?: string): Promise<OffDayRecord[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/schedules/offdays?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  // Backup Driver Assignment API [F-02-3]
  public static async getBackupAssignments(): Promise<BackupAssignment[]> {
    const res = await fetch(`${API_BASE}/backups`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async getBackupCandidates(date: string): Promise<Driver[]> {
    const res = await fetch(`${API_BASE}/backups/candidates?date=${date}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async assignBackup(form: AssignBackupForm): Promise<BackupAssignment> {
    const res = await fetch(`${API_BASE}/backups/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }
}
