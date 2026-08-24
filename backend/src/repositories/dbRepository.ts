import { getDb } from "../../../db";
import {
  Company,
  Admin,
  CreateAdminDTO,
  UpdateAdminDTO,
  LoginResponseDTO,
  Camp,
  Route,
  Driver,
  CreateDriverDTO,
  UpdateDriverDTO,
  ScheduleShift,
  BackupAssignment,
  AssignBackupDTO,
} from "../types";

// 6자리 난수 회사 코드 생성기 (영문 대문자 + 숫자)
export function generateCompanyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동하기 쉬운 I, O, 0, 1 제외
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// Master Data Repositories (Company / Camp / Route)
// ==========================================

class MasterRepository {
  private async getValidCompanyId(inputCompanyId?: number): Promise<number> {
    try {
      const sb = getDb();
      if (
        inputCompanyId &&
        typeof inputCompanyId === "number" &&
        !isNaN(inputCompanyId)
      ) {
        return inputCompanyId;
      }
      const { data: allComp, error } = await sb.from("companies").select("id").limit(1);
      if (!error && allComp && allComp.length > 0) {
        return (allComp[0] as { id: number }).id;
      }
      return 1;
    } catch (err) {
      console.error("[getValidCompanyId] error:", err);
      return 1;
    }
  }

  public async findAllCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await getDb()
        .from("companies")
        .select("*")
        .order("id");
      if (error) throw error;
      const rows = (data || []) as {
        id: number;
        name: string;
        company_code?: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        companyCode: r.company_code || "",
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error("[findAllCompanies] error:", err);
      return [];
    }
  }

  public async findCompanyByCode(companyCode: string): Promise<Company | null> {
    const code = companyCode.trim().toUpperCase();
    try {
      const { data, error } = await getDb()
        .from("companies")
        .select("*")
        .ilike("company_code", code)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as {
        id: number;
        name: string;
        company_code: string;
        created_at: string;
      };
      return {
        id: row.id,
        name: row.name,
        companyCode: row.company_code,
        createdAt: row.created_at,
      };
    } catch (err) {
      console.error("[findCompanyByCode error]:", err);
      return null;
    }
  }

  public async createCompany(name: string): Promise<Company> {
    const trimmed = name.trim();
    const sb = getDb();
    const { data: existing } = await sb
      .from("companies")
      .select("*")
      .eq("name", trimmed)
      .maybeSingle();
    if (existing) {
      const row = existing as {
        id: number;
        name: string;
        company_code: string;
        created_at: string;
      };
      return {
        id: row.id,
        name: row.name,
        companyCode: row.company_code,
        createdAt: row.created_at,
      };
    }

    // 6자리 고유 코드 발급
    let generatedCode = generateCompanyCode();
    for (let i = 0; i < 5; i++) {
      const { data: dup } = await sb
        .from("companies")
        .select("id")
        .eq("company_code", generatedCode)
        .maybeSingle();
      if (!dup) break;
      generatedCode = generateCompanyCode();
    }

    const { data, error } = await sb
      .from("companies")
      .insert({ name: trimmed, company_code: generatedCode })
      .select()
      .single();
    if (error) throw error;
    const row = data as {
      id: number;
      name: string;
      company_code: string;
      created_at: string;
    };

    // 회사 생성 시 기본 슈퍼 관리자 계정 생성 (id: admin / pw: 1234)
    try {
      await adminRepository.createAdmin({
        companyId: row.id,
        loginId: "admin",
        password: "password123",
        name: `${trimmed} 관리자`,
        isAllCampsAccessible: true,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      });
    } catch (adminErr) {
      console.error("[createCompany default admin error]:", adminErr);
    }

    return {
      id: row.id,
      name: row.name,
      companyCode: row.company_code,
      createdAt: row.created_at,
    };
  }

  public async deleteCompany(id: number): Promise<boolean> {
    try {
      const { error } = await getDb().from("companies").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[deleteCompany] error:", err);
    }
    return true;
  }

  // Camps
  public async findAllCamps(): Promise<Camp[]> {
    try {
      const { data, error } = await getDb()
        .from("camps")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as {
        id: number;
        company_id: number;
        name: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        companyId: r.company_id,
        name: r.name,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error("[findAllCamps] error:", err);
      return [];
    }
  }

  public async findCampsByCompany(companyId: number): Promise<Camp[]> {
    try {
      const validCompanyId = await this.getValidCompanyId(companyId);
      const { data, error } = await getDb()
        .from("camps")
        .select("*")
        .eq("company_id", validCompanyId)
        .order("name", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as {
        id: number;
        company_id: number;
        name: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        companyId: r.company_id,
        name: r.name,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error("[findCampsByCompany] error:", err);
      return [];
    }
  }

  public async createCamp(companyId: number, name: string): Promise<Camp> {
    const trimmed = name.trim();
    const validCompanyId = await this.getValidCompanyId(companyId);

    // 중복 체크
    const { data: existing } = await getDb()
      .from("camps")
      .select("*")
      .eq("company_id", validCompanyId)
      .ilike("name", trimmed)
      .maybeSingle();
    if (existing) {
      throw new Error(`이미 등록된 캠프명입니다. ('${trimmed}')`);
    }

    const { data, error } = await getDb()
      .from("camps")
      .insert({ company_id: validCompanyId, name: trimmed })
      .select()
      .single();
    if (error) throw error;
    console.log(
      `[createCamp SUCCESS] Saved to DB -> id: ${(data as { id: number }).id}, name: ${trimmed}`,
    );
    const row = data as {
      id: number;
      company_id: number;
      name: string;
      created_at: string;
    };
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  public async deleteCamp(id: number): Promise<boolean> {
    try {
      await getDb().from("routes").delete().eq("camp_id", id);
      const { error } = await getDb().from("camps").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[deleteCamp] error:", err);
    }
    return true;
  }

  // Routes
  public async findAllRoutes(): Promise<Route[]> {
    try {
      const { data, error } = await getDb()
        .from("routes")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as {
        id: number;
        camp_id: number;
        name: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        campId: r.camp_id,
        name: r.name,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error("[findAllRoutes] error:", err);
      return [];
    }
  }

  public async findRoutesByCamp(campId: number): Promise<Route[]> {
    try {
      const { data, error } = await getDb()
        .from("routes")
        .select("*")
        .eq("camp_id", campId)
        .order("name", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as {
        id: number;
        camp_id: number;
        name: string;
        created_at: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        campId: r.camp_id,
        name: r.name,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error("[findRoutesByCamp] error:", err);
      return [];
    }
  }

  public async createRoute(campId: number, name: string): Promise<Route> {
    const trimmed = name.trim();
    const { data: existing } = await getDb()
      .from("routes")
      .select("*")
      .eq("camp_id", campId)
      .ilike("name", trimmed)
      .maybeSingle();
    if (existing) {
      throw new Error(`이미 등록된 라우터명입니다. ('${trimmed}')`);
    }

    const { data, error } = await getDb()
      .from("routes")
      .insert({ camp_id: campId, name: trimmed })
      .select()
      .single();
    if (error) throw error;
    console.log(
      `[createRoute SUCCESS] Saved to DB -> id: ${(data as { id: number }).id}, name: ${trimmed}`,
    );
    const row = data as {
      id: number;
      camp_id: number;
      name: string;
      created_at: string;
    };
    return {
      id: row.id,
      campId: row.camp_id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  public async deleteRoute(id: number): Promise<boolean> {
    try {
      const { error } = await getDb().from("routes").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[deleteRoute] error:", err);
    }
    return true;
  }
}

// ==========================================
// Admin & Permission Repository
// ==========================================

class AdminRepository {
  private async getAdminCampInfo(
    adminId: number,
  ): Promise<{ campIds: number[]; campNames: string[] }> {
    try {
      const sb = getDb();
      const { data: mappings, error } = await sb
        .from("admin_camps")
        .select("camp_id, camps(id, name)")
        .eq("admin_id", adminId);

      if (error || !mappings) return { campIds: [], campNames: [] };

      const campIds: number[] = [];
      const campNames: string[] = [];

      mappings.forEach((m: any) => {
        if (m.camp_id) campIds.push(m.camp_id);
        if (m.camps?.name) campNames.push(m.camps.name);
      });

      return { campIds, campNames };
    } catch (err) {
      console.error("[getAdminCampInfo error]:", err);
      return { campIds: [], campNames: [] };
    }
  }

  public async findAdminByCredentials(
    companyCode: string,
    loginId: string,
    password: string,
  ): Promise<LoginResponseDTO> {
    const trimmedCode = companyCode.trim().toUpperCase();
    const trimmedLoginId = loginId.trim();
    const trimmedPw = password.trim();

    const sb = getDb();
    // 1. 회사 존재 여부 확인
    const company = await masterRepository.findCompanyByCode(trimmedCode);
    if (!company) {
      throw new Error("존재하지 않는 회사 코드입니다. 회사 코드를 확인해주세요.");
    }

    // 2. 관리자 아이디 존재 여부 확인
    const { data: adminData, error: adminErr } = await sb
      .from("admins")
      .select("*")
      .eq("company_id", company.id)
      .eq("login_id", trimmedLoginId)
      .maybeSingle();

    if (adminErr || !adminData) {
      throw new Error("해당 회사에 등록되지 않은 관리자 아이디입니다.");
    }

    // 3. 비밀번호 일치 여부 확인
    if (adminData.password !== trimmedPw) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 4. 권한 및 담당 캠프 정보 조회
    const { campIds, campNames } = await this.getAdminCampInfo(adminData.id);
    return {
      adminId: adminData.id,
      loginId: adminData.login_id,
      adminName: adminData.name,
      companyId: company.id,
      companyCode: company.companyCode,
      companyName: company.name,
      permissions: {
        isAllCampsAccessible: adminData.is_all_camps_accessible ?? true,
        canCreate: adminData.can_create ?? true,
        canRead: adminData.can_read ?? true,
        canUpdate: adminData.can_update ?? true,
        canDelete: adminData.can_delete ?? true,
        assignedCampIds: campIds,
        assignedCampNames: campNames,
      },
    };
  }

  public async findAdminsByCompany(companyId: number): Promise<Admin[]> {
    try {
      const sb = getDb();
      const { data, error } = await sb
        .from("admins")
        .select("*")
        .eq("company_id", companyId)
        .order("id", { ascending: true });

      if (error || !data) return [];

      const adminList: Admin[] = [];
      for (const row of data) {
        const { campIds, campNames } = await this.getAdminCampInfo(row.id);
        adminList.push({
          id: row.id,
          companyId: row.company_id,
          loginId: row.login_id,
          name: row.name,
          isAllCampsAccessible: row.is_all_camps_accessible ?? true,
          canCreate: row.can_create ?? true,
          canRead: row.can_read ?? true,
          canUpdate: row.can_update ?? true,
          canDelete: row.can_delete ?? true,
          assignedCampIds: campIds,
          assignedCampNames: campNames,
          createdAt: row.created_at,
        });
      }
      return adminList;
    } catch (err) {
      console.error("[findAdminsByCompany error]:", err);
      return [];
    }
  }

  public async findAdminById(adminId: number): Promise<Admin | null> {
    try {
      const sb = getDb();
      const { data, error } = await sb
        .from("admins")
        .select("*")
        .eq("id", adminId)
        .maybeSingle();
      if (error || !data) return null;

      const { campIds, campNames } = await this.getAdminCampInfo(data.id);
      return {
        id: data.id,
        companyId: data.company_id,
        loginId: data.login_id,
        name: data.name,
        isAllCampsAccessible: data.is_all_camps_accessible ?? true,
        canCreate: data.can_create ?? true,
        canRead: data.can_read ?? true,
        canUpdate: data.can_update ?? true,
        canDelete: data.can_delete ?? true,
        assignedCampIds: campIds,
        assignedCampNames: campNames,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error("[findAdminById error]:", err);
      return null;
    }
  }

  public async createAdmin(dto: CreateAdminDTO): Promise<Admin> {
    const sb = getDb();
    const { data, error } = await sb
      .from("admins")
      .insert({
        company_id: dto.companyId,
        login_id: dto.loginId.trim(),
        password: dto.password.trim(),
        name: dto.name.trim(),
        is_all_camps_accessible: dto.isAllCampsAccessible ?? true,
        can_create: dto.canCreate ?? true,
        can_read: dto.canRead ?? true,
        can_update: dto.canUpdate ?? true,
        can_delete: dto.canDelete ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    const newAdmin = data as any;
    if (dto.assignedCampIds && dto.assignedCampIds.length > 0) {
      const campInserts = dto.assignedCampIds.map((campId) => ({
        admin_id: newAdmin.id,
        camp_id: campId,
      }));
      await sb.from("admin_camps").insert(campInserts);
    }

    const { campIds, campNames } = await this.getAdminCampInfo(newAdmin.id);
    return {
      id: newAdmin.id,
      companyId: newAdmin.company_id,
      loginId: newAdmin.login_id,
      name: newAdmin.name,
      isAllCampsAccessible: newAdmin.is_all_camps_accessible,
      canCreate: newAdmin.can_create,
      canRead: newAdmin.can_read,
      canUpdate: newAdmin.can_update,
      canDelete: newAdmin.can_delete,
      assignedCampIds: campIds,
      assignedCampNames: campNames,
      createdAt: newAdmin.created_at,
    };
  }

  public async updateAdmin(
    adminId: number,
    dto: UpdateAdminDTO,
  ): Promise<Admin | null> {
    const sb = getDb();
    const updatePayload: Record<string, any> = {};

    if (dto.loginId !== undefined) updatePayload.login_id = dto.loginId.trim();
    if (dto.password !== undefined && dto.password.trim() !== "")
      updatePayload.password = dto.password.trim();
    if (dto.name !== undefined) updatePayload.name = dto.name.trim();
    if (dto.isAllCampsAccessible !== undefined)
      updatePayload.is_all_camps_accessible = dto.isAllCampsAccessible;
    if (dto.canCreate !== undefined) updatePayload.can_create = dto.canCreate;
    if (dto.canRead !== undefined) updatePayload.can_read = dto.canRead;
    if (dto.canUpdate !== undefined) updatePayload.can_update = dto.canUpdate;
    if (dto.canDelete !== undefined) updatePayload.can_delete = dto.canDelete;

    const { data, error } = await sb
      .from("admins")
      .update(updatePayload)
      .eq("id", adminId)
      .select()
      .single();

    if (error || !data) return null;

    if (dto.assignedCampIds !== undefined) {
      await sb.from("admin_camps").delete().eq("admin_id", adminId);
      if (dto.assignedCampIds.length > 0) {
        const campInserts = dto.assignedCampIds.map((campId) => ({
          admin_id: adminId,
          camp_id: campId,
        }));
        await sb.from("admin_camps").insert(campInserts);
      }
    }

    const { campIds, campNames } = await this.getAdminCampInfo(adminId);
    return {
      id: data.id,
      companyId: data.company_id,
      loginId: data.login_id,
      name: data.name,
      isAllCampsAccessible: data.is_all_camps_accessible,
      canCreate: data.can_create,
      canRead: data.can_read,
      canUpdate: data.can_update,
      canDelete: data.can_delete,
      assignedCampIds: campIds,
      assignedCampNames: campNames,
      createdAt: data.created_at,
    };
  }

  public async deleteAdmin(adminId: number): Promise<boolean> {
    try {
      const sb = getDb();
      await sb.from("admin_camps").delete().eq("admin_id", adminId);
      const { error } = await sb.from("admins").delete().eq("id", adminId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("[deleteAdmin error]:", err);
      return false;
    }
  }
}

// ==========================================
// Driver Helpers
// ==========================================

async function getOrCreateCampId(
  campName: string,
  companyId?: number,
): Promise<number> {
  const trimmed = campName.trim();
  if (!trimmed) return 0;

  const sb = getDb();
  let targetCompanyId: number;

  if (companyId) {
    targetCompanyId = companyId;
  } else {
    const { data: allComp } = await sb.from("companies").select("id").limit(1);
    const rows = (allComp || []) as { id: number }[];
    if (rows.length > 0) {
      targetCompanyId = rows[0].id;
    } else {
      targetCompanyId = 1;
    }
  }

  const { data: existing } = await sb
    .from("camps")
    .select("*")
    .eq("company_id", targetCompanyId)
    .eq("name", trimmed)
    .maybeSingle();
  if (existing) return (existing as { id: number }).id;

  const { data: inserted, error } = await sb
    .from("camps")
    .insert({ company_id: targetCompanyId, name: trimmed })
    .select()
    .single();
  if (error) throw error;
  return (inserted as { id: number }).id;
}

async function saveCampRoutes(
  driverId: number,
  campStr: string,
  routesStr: string,
  companyId?: number,
) {
  const sb = getDb();
  await sb.from("driver_camp_routes").delete().eq("driver_id", driverId);

  const campArr = (campStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const routeArr = (routesStr || "").split(",").map((s) => s.trim());

  if (campArr.length === 0) return;

  // 1. Target Company ID 확인
  let targetCompanyId: number;
  if (companyId) {
    targetCompanyId = companyId;
  } else {
    const { data: allComp } = await sb.from("companies").select("id").limit(1);
    const rows = (allComp || []) as { id: number }[];
    if (rows.length > 0) {
      targetCompanyId = rows[0].id;
    } else {
      targetCompanyId = 1;
    }
  }

  // 2. 입력된 캠프들을 한 번에 조회 및 없는 캠프 일괄 생성
  const uniqueCampNames = Array.from(new Set(campArr));
  const { data: existingCampsData } = await sb
    .from("camps")
    .select("id, name")
    .eq("company_id", targetCompanyId);

  const existingCamps = (existingCampsData || []) as {
    id: number;
    name: string;
  }[];
  const campMap = new Map<string, number>();
  existingCamps.forEach((c) => campMap.set(c.name.toLowerCase(), c.id));

  // 없는 캠프 생성
  const campsToCreate = uniqueCampNames.filter(
    (c) => !campMap.has(c.toLowerCase()),
  );
  if (campsToCreate.length > 0) {
    const { data: insertedCamps } = await sb
      .from("camps")
      .insert(
        campsToCreate.map((name) => ({ company_id: targetCompanyId, name })),
      )
      .select();
    ((insertedCamps || []) as { id: number; name: string }[]).forEach((c) => {
      campMap.set(c.name.toLowerCase(), c.id);
    });
  }

  // 3. 라우터 일괄 처리
  const campIds = Array.from(campMap.values());
  const { data: existingRoutesData } = await sb
    .from("routes")
    .select("id, camp_id, name")
    .in("camp_id", campIds);

  const existingRoutes = (existingRoutesData || []) as {
    id: number;
    camp_id: number;
    name: string;
  }[];
  const routeMap = new Map<string, number>(); // "campId_routeName" -> routeId
  existingRoutes.forEach((r) =>
    routeMap.set(`${r.camp_id}_${r.name.toLowerCase()}`, r.id),
  );

  const mappingInserts: {
    driver_id: number;
    camp_id: number;
    route_id: number | null;
    route_name: string;
  }[] = [];

  for (let i = 0; i < campArr.length; i++) {
    const cName = campArr[i];
    const rName = routeArr[i] || "";
    const campId = campMap.get(cName.toLowerCase());
    if (!campId) continue;

    if (rName.trim()) {
      const routeKey = `${campId}_${rName.trim().toLowerCase()}`;
      let routeId = routeMap.get(routeKey);

      if (!routeId) {
        // 새 라우터 생성
        const { data: insertedRoute } = await sb
          .from("routes")
          .insert({ camp_id: campId, name: rName.trim() })
          .select()
          .single();
        if (insertedRoute) {
          routeId = (insertedRoute as { id: number }).id;
          routeMap.set(routeKey, routeId);
        }
      }

      mappingInserts.push({
        driver_id: driverId,
        camp_id: campId,
        route_id: routeId ?? null,
        route_name: rName.trim(),
      });
    } else {
      mappingInserts.push({
        driver_id: driverId,
        camp_id: campId,
        route_id: null,
        route_name: "",
      });
    }
  }

  // 4. driver_camp_routes 한 번에 일괄 삽입
  if (mappingInserts.length > 0) {
    await sb.from("driver_camp_routes").insert(mappingInserts);
  }
}

async function getDriverFull(driverRow: {
  id: number;
  company_id: number | null;
  driver_code: string;
  name: string;
  phone: string;
  contract_type: string;
  created_at: string;
  is_deleted: boolean;
}): Promise<Driver> {
  const sb = getDb();

  const { data: mappingsData } = await sb
    .from("driver_camp_routes")
    .select("camp_id, route_id, route_name, camps(name)")
    .eq("driver_id", driverRow.id);

  type MappingRow = {
    camp_id: number;
    route_id: number | null;
    route_name: string;
    camps: { name: string } | null;
  };
  const mappings = ((mappingsData || []) as unknown as MappingRow[]).sort(
    (a, b) => {
      const campComp = (a.camps?.name || "").localeCompare(
        b.camps?.name || "",
        undefined,
        { numeric: true },
      );
      if (campComp !== 0) return campComp;
      return a.route_name.localeCompare(b.route_name, undefined, {
        numeric: true,
      });
    },
  );

  let companyName = "";
  if (driverRow.company_id) {
    const { data: compRow } = await sb
      .from("companies")
      .select("name")
      .eq("id", driverRow.company_id)
      .single();
    if (compRow) companyName = (compRow as { name: string }).name;
  }

  const campNames = mappings.map((m) => m.camps?.name || "");
  const routes = mappings.map((m) => m.route_name);

  return {
    id: driverRow.id,
    companyId: driverRow.company_id ?? undefined,
    companyName,
    driverCode: driverRow.driver_code || "",
    name: driverRow.name,
    phone: driverRow.phone,
    camp: campNames.join(","),
    routes: routes.join(","),
    contractType: driverRow.contract_type as Driver["contractType"],
    createdAt: driverRow.created_at,
    isDeleted: driverRow.is_deleted,
    campRoutes: mappings.map((m) => ({
      campId: m.camp_id,
      campName: m.camps?.name || "",
      routeId: m.route_id ?? undefined,
      route: m.route_name,
    })),
  };
}

// ==========================================
// DriverRepository
// ==========================================

class DriverRepository {
  public async findAll(includeDeleted = false): Promise<Driver[]> {
    try {
      const sb = getDb();
      const query = sb.from("drivers").select("*").order("id");
      // is_deleted = false 이거나 is_deleted IS NULL 인 데이터 모두 조회 (삭제된 true만 제외)
      const { data: driverRows, error } = includeDeleted
        ? await query
        : await query.or("is_deleted.eq.false,is_deleted.is.null");

      if (error) {
        console.error("[DriverRepository.findAll error]:", error);
        return [];
      }

      const filteredDrivers = (driverRows || []) as {
        id: number;
        company_id: number | null;
        driver_code: string;
        name: string;
        phone: string;
        contract_type: string;
        created_at: string;
        is_deleted: boolean | null;
      }[];

      if (filteredDrivers.length === 0) return [];

      // 배치 조회
      const { data: allCampRoutesData, error: campRouteErr } = await sb
        .from("driver_camp_routes")
        .select("driver_id, camp_id, route_id, route_name, camps(name)");
      if (campRouteErr) {
        console.error(
          "[DriverRepository driver_camp_routes error]:",
          campRouteErr,
        );
      }

      const { data: compRowsData } = await sb
        .from("companies")
        .select("id, name");

      type AllCampRouteRow = {
        driver_id: number;
        camp_id: number;
        route_id: number | null;
        route_name: string;
        camps: { name: string } | null;
      };
      const allCampRoutes = (allCampRoutesData ||
        []) as unknown as AllCampRouteRow[];
      const compMap = new Map(
        ((compRowsData || []) as { id: number; name: string }[]).map((c) => [
          c.id,
          c.name,
        ]),
      );

      const mappingMap = new Map<number, typeof allCampRoutes>();
      allCampRoutes.forEach((r) => {
        const list = mappingMap.get(r.driver_id) || [];
        list.push(r);
        mappingMap.set(r.driver_id, list);
      });

      mappingMap.forEach((list) => {
        list.sort((a, b) => {
          const campComp = (a.camps?.name || "").localeCompare(
            b.camps?.name || "",
            undefined,
            { numeric: true },
          );
          if (campComp !== 0) return campComp;
          return a.route_name.localeCompare(b.route_name, undefined, {
            numeric: true,
          });
        });
      });

      return filteredDrivers.map((d) => {
        const mappings = mappingMap.get(d.id) || [];
        return {
          id: d.id,
          companyId: d.company_id ?? undefined,
          companyName: d.company_id ? compMap.get(d.company_id) : undefined,
          driverCode: d.driver_code || "",
          name: d.name,
          phone: d.phone,
          camp: mappings.map((m) => m.camps?.name || "").join(","),
          routes: mappings.map((m) => m.route_name).join(","),
          contractType: d.contract_type as Driver["contractType"],
          createdAt: d.created_at,
          isDeleted: !!d.is_deleted,
          campRoutes: mappings.map((m) => ({
            campId: m.camp_id,
            campName: m.camps?.name || "",
            routeId: m.route_id ?? undefined,
            route: m.route_name,
          })),
        };
      });
    } catch (err) {
      console.error("[DriverRepository.findAll exception]:", err);
      return [];
    }
  }

  public async findById(id: number): Promise<Driver | undefined> {
    try {
      const sb = getDb();
      const { data, error } = await sb
        .from("drivers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return undefined;
      const row = data as Parameters<typeof getDriverFull>[0];
      if (row.is_deleted) return undefined;
      return getDriverFull(row);
    } catch (err) {
      console.error("[DriverRepository.findById error]:", err);
      return undefined;
    }
  }

  public async create(dto: CreateDriverDTO): Promise<Driver> {
    const sb = getDb();
    const { data: row, error } = await sb
      .from("drivers")
      .insert({
        company_id: dto.companyId,
        driver_code: (dto.driverCode ?? "").trim(),
        name: dto.name,
        phone: dto.phone,
        contract_type: dto.contractType,
        is_deleted: false,
      })
      .select()
      .single();
    if (error) throw error;

    const driverRow = row as Parameters<typeof getDriverFull>[0];
    await saveCampRoutes(driverRow.id, dto.camp, dto.routes, dto.companyId);
    return getDriverFull(driverRow);
  }

  public async update(
    id: number,
    dto: UpdateDriverDTO,
  ): Promise<Driver | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sb = getDb();
    const { data: row, error } = await sb
      .from("drivers")
      .update({
        company_id:
          dto.companyId !== undefined ? dto.companyId : existing.companyId,
        driver_code:
          dto.driverCode !== undefined
            ? dto.driverCode.trim()
            : existing.driverCode,
        name: dto.name ?? existing.name,
        phone: dto.phone ?? existing.phone,
        contract_type: dto.contractType ?? existing.contractType,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (row && (dto.camp !== undefined || dto.routes !== undefined)) {
      const campStr = dto.camp !== undefined ? dto.camp : existing.camp;
      const routesStr = dto.routes !== undefined ? dto.routes : existing.routes;
      await saveCampRoutes(
        id,
        campStr,
        routesStr,
        dto.companyId ?? existing.companyId,
      );
    }

    return row
      ? getDriverFull(row as Parameters<typeof getDriverFull>[0])
      : null;
  }

  public async softDelete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    const sb = getDb();
    // 기사와 연결된 driver_camp_routes 데이터 함께 삭제
    await sb.from("driver_camp_routes").delete().eq("driver_id", id);
    const { error } = await sb
      .from("drivers")
      .update({ is_deleted: true })
      .eq("id", id);
    if (error) throw error;
    return true;
  }

  public async delete(id: number): Promise<boolean> {
    const sb = getDb();
    // 기사와 연결된 driver_camp_routes 및 스케줄 데이터 함께 삭제
    await sb.from("driver_camp_routes").delete().eq("driver_id", id);
    await sb.from("schedule_shifts").delete().eq("driver_id", id);
    const { error } = await sb.from("drivers").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
}

// ==========================================
// ScheduleRepository
// ==========================================

class ScheduleRepository {
  public async findShifts(
    startDate?: string,
    endDate?: string,
    driverId?: number,
  ): Promise<ScheduleShift[]> {
    try {
      const sb = getDb();
      let query = sb.from("schedule_shifts").select("*");
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
      if (driverId !== undefined) query = query.eq("driver_id", driverId);

      const { data, error } = await query;
      if (error) {
        console.error("[findShifts error]:", error);
        return [];
      }
      const rows = (data || []) as {
        id: number;
        driver_id: number;
        date: string;
        status: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        driverId: r.driver_id,
        date: r.date,
        status: r.status as ScheduleShift["status"],
      }));
    } catch (err) {
      console.error("[findShifts exception]:", err);
      return [];
    }
  }

  public async findShift(
    driverId: number,
    date: string,
  ): Promise<ScheduleShift | undefined> {
    try {
      const { data, error } = await getDb()
        .from("schedule_shifts")
        .select("*")
        .eq("driver_id", driverId)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const r = data as {
        id: number;
        driver_id: number;
        date: string;
        status: string;
      };
      return {
        id: r.id,
        driverId: r.driver_id,
        date: r.date,
        status: r.status as ScheduleShift["status"],
      };
    } catch (err) {
      console.error("[findShift error]:", err);
      return undefined;
    }
  }

  public async upsertShift(
    driverId: number,
    date: string,
    status: ScheduleShift["status"],
  ): Promise<ScheduleShift> {
    const existing = await this.findShift(driverId, date);
    const sb = getDb();

    if (existing) {
      const { data, error } = await sb
        .from("schedule_shifts")
        .update({ status })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      const r = data as {
        id: number;
        driver_id: number;
        date: string;
        status: string;
      };
      return {
        id: r.id,
        driverId: r.driver_id,
        date: r.date,
        status: r.status as ScheduleShift["status"],
      };
    }

    const { data, error } = await sb
      .from("schedule_shifts")
      .insert({ driver_id: driverId, date, status })
      .select()
      .single();
    if (error) throw error;
    const r = data as {
      id: number;
      driver_id: number;
      date: string;
      status: string;
    };
    return {
      id: r.id,
      driverId: r.driver_id,
      date: r.date,
      status: r.status as ScheduleShift["status"],
    };
  }

  public async getOffDays(
    startDate?: string,
    endDate?: string,
  ): Promise<ScheduleShift[]> {
    try {
      const sb = getDb();
      let query = sb.from("schedule_shifts").select("*").eq("status", "휴무");
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query;
      if (error) {
        console.error("[getOffDays error]:", error);
        return [];
      }
      const rows = (data || []) as {
        id: number;
        driver_id: number;
        date: string;
        status: string;
      }[];
      return rows.map((r) => ({
        id: r.id,
        driverId: r.driver_id,
        date: r.date,
        status: r.status as ScheduleShift["status"],
      }));
    } catch (err) {
      console.error("[getOffDays exception]:", err);
      return [];
    }
  }
}

// ==========================================
// BackupRepository
// ==========================================

class BackupRepository {
  private toBackup(row: {
    id: number;
    date: string;
    camp_name?: string | null;
    route_number: string;
    original_driver_id: number;
    original_driver_name: string;
    backup_driver_id: number;
    backup_driver_name: string;
    note: string | null;
    created_at: string;
    updated_at?: string;
  }): BackupAssignment {
    return {
      id: row.id,
      date: row.date,
      campName: row.camp_name ?? undefined,
      routeNumber: row.route_number,
      originalDriverId: row.original_driver_id,
      originalDriverName: row.original_driver_name,
      backupDriverId: row.backup_driver_id,
      backupDriverName: row.backup_driver_name,
      note: row.note ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async findAll(): Promise<BackupAssignment[]> {
    try {
      const { data, error } = await getDb()
        .from("backup_assignments")
        .select("*")
        .order("id");
      if (error) {
        console.error("[findAll backupAssignments error]:", error);
        return [];
      }
      return (
        (data || []) as Parameters<BackupRepository["toBackup"]>[0][]
      ).map((r) => this.toBackup(r));
    } catch (err) {
      console.error("[findAll backupAssignments exception]:", err);
      return [];
    }
  }

  public async findByDateAndRoute(
    date: string,
    routeNumber: string,
  ): Promise<BackupAssignment | undefined> {
    try {
      const { data } = await getDb()
        .from("backup_assignments")
        .select("*")
        .eq("date", date)
        .eq("route_number", routeNumber)
        .maybeSingle();
      return data
        ? this.toBackup(data as Parameters<BackupRepository["toBackup"]>[0])
        : undefined;
    } catch (err) {
      console.error("[findByDateAndRoute error]:", err);
      return undefined;
    }
  }

  public async findByDate(date: string): Promise<BackupAssignment[]> {
    try {
      const { data, error } = await getDb()
        .from("backup_assignments")
        .select("*")
        .eq("date", date);
      if (error) {
        console.error("[findByDate error]:", error);
        return [];
      }
      return (
        (data || []) as Parameters<BackupRepository["toBackup"]>[0][]
      ).map((r) => this.toBackup(r));
    } catch (err) {
      console.error("[findByDate exception]:", err);
      return [];
    }
  }

  public async assignBackup(
    dto: AssignBackupDTO,
  ): Promise<BackupAssignment | null> {
    const originalDriver = await driverRepository.findById(
      dto.originalDriverId,
    );
    const backupDriver = await driverRepository.findById(dto.backupDriverId);
    if (!originalDriver || !backupDriver) return null;

    const sb = getDb();
    await sb
      .from("backup_assignments")
      .delete()
      .eq("date", dto.date)
      .eq("route_number", dto.routeNumber);

    const now = new Date().toISOString();
    const { data, error } = await sb
      .from("backup_assignments")
      .insert({
        date: dto.date,
        camp_name: dto.campName || null,
        route_number: dto.routeNumber,
        original_driver_id: originalDriver.id,
        original_driver_name: originalDriver.name,
        backup_driver_id: backupDriver.id,
        backup_driver_name: backupDriver.name,
        note: dto.note || "수동 지정 완료",
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    return this.toBackup(data as Parameters<BackupRepository["toBackup"]>[0]);
  }

  public async removeAssignment(
    date: string,
    routeNumber: string,
  ): Promise<boolean> {
    const existing = await this.findByDateAndRoute(date, routeNumber);
    if (!existing) return false;

    await getDb()
      .from("backup_assignments")
      .delete()
      .eq("date", date)
      .eq("route_number", routeNumber);
    return true;
  }
}

// ==========================================
// Monthly Roster Repository (신규 테이블 CRUD)
// ==========================================

import {
  MonthlyRoster,
  MonthlyRosterItem,
  CreateMonthlyRosterDTO,
  UpdateMonthlyRosterDTO,
} from "../types";

class MonthlyRosterRepository {
  // 메모리 폴백 캐시 (DB 테이블 최초 생성 전 또는 통신 장애 대비)
  private fallbackRosters: Map<number, MonthlyRoster> = new Map();
  private nextId = 1;

  public async findAll(): Promise<MonthlyRoster[]> {
    try {
      const sb = getDb();
      const { data, error } = await sb
        .from("monthly_rosters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "[MonthlyRosterRepository.findAll DB error, using fallback]:",
          error.message,
        );
        return Array.from(this.fallbackRosters.values()).sort(
          (a, b) => b.id - a.id,
        );
      }

      const rows = data || [];
      return rows.map((r: any) => ({
        id: r.id,
        targetMonth: r.target_month,
        title: r.title,
        memo: r.memo || "",
        status: r.status || "approved",
        totalAssignments: r.total_assignments || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err) {
      console.warn("[MonthlyRosterRepository.findAll exception]:", err);
      return Array.from(this.fallbackRosters.values()).sort(
        (a, b) => b.id - a.id,
      );
    }
  }

  public async findById(id: number): Promise<MonthlyRoster | null> {
    try {
      const sb = getDb();
      const { data: rosterData, error: rosterErr } = await sb
        .from("monthly_rosters")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (rosterErr || !rosterData) {
        return this.fallbackRosters.get(id) || null;
      }

      const { data: itemsData } = await sb
        .from("monthly_roster_items")
        .select("*")
        .eq("roster_id", id)
        .order("date", { ascending: true });

      const items: MonthlyRosterItem[] = (itemsData || []).map((it: any) => ({
        id: it.id,
        rosterId: it.roster_id,
        date: typeof it.date === "string" ? it.date.slice(0, 10) : it.date,
        campName: it.camp_name,
        routeName: it.route_name,
        routeKey: it.route_key,
        driverId: it.driver_id ?? undefined,
        driverName: it.driver_name ?? undefined,
        contractType: it.contract_type ?? undefined,
        status: it.status,
        backupDriverId: it.backup_driver_id ?? undefined,
        backupDriverName: it.backup_driver_name ?? undefined,
      }));

      return {
        id: rosterData.id,
        targetMonth: rosterData.target_month,
        title: rosterData.title,
        memo: rosterData.memo || "",
        status: rosterData.status || "approved",
        totalAssignments: rosterData.total_assignments || items.length,
        createdAt: rosterData.created_at,
        updatedAt: rosterData.updated_at,
        items,
      };
    } catch (err) {
      console.warn("[MonthlyRosterRepository.findById exception]:", err);
      return this.fallbackRosters.get(id) || null;
    }
  }

  public async create(dto: CreateMonthlyRosterDTO): Promise<MonthlyRoster> {
    const totalAssignments = dto.items.length;
    const nowStr = new Date().toISOString();

    try {
      const sb = getDb();
      // 1. Master Insert
      const { data: insertedMaster, error: masterErr } = await sb
        .from("monthly_rosters")
        .insert({
          target_month: dto.targetMonth,
          title: dto.title,
          memo: dto.memo || "",
          status: dto.status || "approved",
          total_assignments: totalAssignments,
          created_at: nowStr,
          updated_at: nowStr,
        })
        .select()
        .single();

      if (masterErr) {
        throw masterErr;
      }

      const rosterId = (insertedMaster as any).id;

      // 2. Items Bulk Insert
      if (dto.items.length > 0) {
        const itemRows = dto.items.map((it) => ({
          roster_id: rosterId,
          date: it.date,
          camp_name: it.campName,
          route_name: it.routeName,
          route_key: it.routeKey,
          driver_id: it.driverId || null,
          driver_name: it.driverName || null,
          contract_type: it.contractType || null,
          status: it.status,
          backup_driver_id: it.backupDriverId || null,
          backup_driver_name: it.backupDriverName || null,
        }));

        // 100개씩 chunk 분할 insert
        for (let i = 0; i < itemRows.length; i += 100) {
          const chunk = itemRows.slice(i, i + 100);
          const { error: itemsErr } = await sb
            .from("monthly_roster_items")
            .insert(chunk);
          if (itemsErr)
            console.error(
              "[MonthlyRosterRepository item insert error]:",
              itemsErr,
            );
        }
      }

      const created: MonthlyRoster = {
        id: rosterId,
        targetMonth: dto.targetMonth,
        title: dto.title,
        memo: dto.memo || "",
        status: dto.status || "approved",
        totalAssignments,
        createdAt: nowStr,
        updatedAt: nowStr,
        items: dto.items,
      };

      this.fallbackRosters.set(rosterId, created);
      return created;
    } catch (err) {
      console.warn(
        "[MonthlyRosterRepository.create DB fallback activated]:",
        err,
      );
      const fakeId = this.nextId++;
      const created: MonthlyRoster = {
        id: fakeId,
        targetMonth: dto.targetMonth,
        title: dto.title,
        memo: dto.memo || "",
        status: dto.status || "approved",
        totalAssignments,
        createdAt: nowStr,
        updatedAt: nowStr,
        items: dto.items,
      };
      this.fallbackRosters.set(fakeId, created);
      return created;
    }
  }

  public async update(
    id: number,
    dto: UpdateMonthlyRosterDTO,
  ): Promise<MonthlyRoster | null> {
    const nowStr = new Date().toISOString();
    try {
      const sb = getDb();
      const updatePayload: any = { updated_at: nowStr };
      if (dto.title !== undefined) updatePayload.title = dto.title;
      if (dto.memo !== undefined) updatePayload.memo = dto.memo;
      if (dto.status !== undefined) updatePayload.status = dto.status;
      if (dto.items) updatePayload.total_assignments = dto.items.length;

      const { data, error } = await sb
        .from("monthly_rosters")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (dto.items) {
        await sb.from("monthly_roster_items").delete().eq("roster_id", id);
        const itemRows = dto.items.map((it) => ({
          roster_id: id,
          date: it.date,
          camp_name: it.campName,
          route_name: it.routeName,
          route_key: it.routeKey,
          driver_id: it.driverId || null,
          driver_name: it.driverName || null,
          contract_type: it.contractType || null,
          status: it.status,
          backup_driver_id: it.backupDriverId || null,
          backup_driver_name: it.backupDriverName || null,
        }));
        for (let i = 0; i < itemRows.length; i += 100) {
          const chunk = itemRows.slice(i, i + 100);
          await sb.from("monthly_roster_items").insert(chunk);
        }
      }

      return this.findById(id);
    } catch (err) {
      console.warn("[MonthlyRosterRepository.update fallback]:", err);
      const existing = this.fallbackRosters.get(id);
      if (!existing) return null;
      const updated: MonthlyRoster = {
        ...existing,
        title: dto.title ?? existing.title,
        memo: dto.memo ?? existing.memo,
        status: dto.status ?? existing.status,
        items: dto.items ?? existing.items,
        totalAssignments: dto.items
          ? dto.items.length
          : existing.totalAssignments,
        updatedAt: nowStr,
      };
      this.fallbackRosters.set(id, updated);
      return updated;
    }
  }

  public async delete(id: number): Promise<boolean> {
    try {
      const sb = getDb();
      await sb.from("monthly_roster_items").delete().eq("roster_id", id);
      await sb.from("monthly_rosters").delete().eq("id", id);
      this.fallbackRosters.delete(id);
      return true;
    } catch (err) {
      console.warn("[MonthlyRosterRepository.delete fallback]:", err);
      this.fallbackRosters.delete(id);
      return true;
    }
  }
}

export const masterRepository = new MasterRepository();
export const adminRepository = new AdminRepository();
export const driverRepository = new DriverRepository();
export const scheduleRepository = new ScheduleRepository();
export const backupRepository = new BackupRepository();
export const monthlyRosterRepository = new MonthlyRosterRepository();
