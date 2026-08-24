import { Driver, CreateDriverForm, UpdateDriverForm } from '../models/driver.model';
import { ScheduleGridRow, ShiftStatus, OffDayRecord, MonthlyRoster, CreateMonthlyRosterForm } from '../models/schedule.model';
import { BackupAssignment, AssignBackupForm } from '../models/backup.model';
import { Company, Camp, Route } from '../models/master.model';
import { UserSession, AdminUser } from '../models/user.model';

const API_BASE = '/api';

export class ApiService {
  // Auth
  public static async login(companyCode: string, loginId: string, password: string): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyCode, loginId, password })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || '로그인에 실패했습니다.');
    return json.data;
  }

  // Admins API
  public static async getAdmins(companyId?: number): Promise<AdminUser[]> {
    const url = companyId ? `${API_BASE}/admins?companyId=${companyId}` : `${API_BASE}/admins`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createAdmin(dto: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async updateAdmin(id: number, dto: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteAdmin(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admins/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  // Master Data API (Company / Camp / Route)
  public static async getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_BASE}/companies`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createCompany(name: string): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteCompany(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/companies/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  public static async getCamps(companyId?: number): Promise<Camp[]> {
    const url = companyId ? `${API_BASE}/camps?companyId=${companyId}` : `${API_BASE}/camps`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createCamp(companyId: number, name: string): Promise<Camp> {
    const res = await fetch(`${API_BASE}/camps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteCamp(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/camps/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  public static async getRoutes(campId?: number): Promise<Route[]> {
    const url = campId ? `${API_BASE}/routes?campId=${campId}` : `${API_BASE}/routes`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createRoute(campId: number, name: string): Promise<Route> {
    const res = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campId, name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteRoute(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/routes/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  // Driver Management API [F-01]
  public static async getDrivers(search?: string, route?: string, contractType?: string, camps?: string): Promise<Driver[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (route) params.append('route', route);
    if (contractType) params.append('contractType', contractType);
    if (camps) params.append('camps', camps);

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

  public static async deleteDriver(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }

  // Schedule Management API [F-02]
  public static async getScheduleGrid(startDate: string, endDate: string, camps?: string): Promise<ScheduleGridRow[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (camps) params.append('camps', camps);
    const res = await fetch(`${API_BASE}/schedules/grid?${params.toString()}`);
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

  // Monthly Rosters API (신규 테이블 CRUD)
  public static async getMonthlyRosters(): Promise<MonthlyRoster[]> {
    const res = await fetch(`${API_BASE}/monthly-rosters`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async getMonthlyRosterById(id: number): Promise<MonthlyRoster> {
    const res = await fetch(`${API_BASE}/monthly-rosters/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async createMonthlyRoster(form: CreateMonthlyRosterForm): Promise<MonthlyRoster> {
    const res = await fetch(`${API_BASE}/monthly-rosters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public static async deleteMonthlyRoster(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/monthly-rosters/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }
}
