import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus,
  KeyRound,
  User,
  Crown,
  Lock,
} from "lucide-react";
import { ApiService } from "../../services/apiService";
import { AdminUser, UserSession, AdminCampRouteMapping } from "../../models/user.model";
import { Camp, Route } from "../../models/master.model";
import { ToastNotification } from "../components/ToastNotification";

interface Props {
  currentUser: UserSession;
}

export const AdminManagementView: React.FC<Props> = ({ currentUser }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [isAllCampsAccessible, setIsAllCampsAccessible] = useState(true);
  const [canCreate, setCanCreate] = useState(true);
  const [canRead, setCanRead] = useState(true);
  const [canUpdate, setCanUpdate] = useState(true);
  const [canDelete, setCanDelete] = useState(true);

  // Camp & Route assignments: array of { campId, campName, routeId?, routeName }
  const [assignedCampIds, setAssignedCampIds] = useState<number[]>([]);
  const [assignedCampRoutes, setAssignedCampRoutes] = useState<AdminCampRouteMapping[]>([]);

  const showToast = (type: "success" | "error", message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, campList, routeList] = await Promise.all([
        ApiService.getAdmins(currentUser.companyId),
        ApiService.getCamps(currentUser.companyId),
        ApiService.getRoutes(),
      ]);
      setAdmins(adminList);
      setCamps(campList);
      setRoutes(routeList);
    } catch (err: any) {
      showToast("error", err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.companyId]);

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setLoginId("");
    setPassword("");
    setName("");
    setIsMaster(false);
    setIsAllCampsAccessible(true);
    setCanCreate(true);
    setCanRead(true);
    setCanUpdate(true);
    setCanDelete(true);
    setAssignedCampIds([]);
    setAssignedCampRoutes([]);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setLoginId(admin.loginId);
    setPassword(""); // Leave blank if not changing
    setName(admin.name);
    setIsMaster(!!admin.isMaster);
    setIsAllCampsAccessible(admin.isAllCampsAccessible);
    setCanCreate(admin.canCreate);
    setCanRead(admin.canRead);
    setCanUpdate(admin.canUpdate);
    setCanDelete(admin.canDelete);
    setAssignedCampIds(admin.assignedCampIds || []);
    setAssignedCampRoutes(
      (admin.assignedCampRoutes || []).map((r) => ({
        campId: r.campId,
        campName: r.campName || "",
        routeId: r.routeId ?? null,
        routeName: r.routeName,
      }))
    );
    setIsFormModalOpen(true);
  };

  const toggleCampSelection = (campId: number) => {
    if (assignedCampIds.includes(campId)) {
      setAssignedCampIds(assignedCampIds.filter((id) => id !== campId));
      setAssignedCampRoutes(assignedCampRoutes.filter((r) => r.campId !== campId));
    } else {
      setAssignedCampIds([...assignedCampIds, campId]);
    }
  };

  const toggleRouteSelection = (camp: Camp, route: Route) => {
    const exists = assignedCampRoutes.some(
      (r) => r.campId === camp.id && (r.routeId === route.id || r.routeName === route.name)
    );
    if (exists) {
      setAssignedCampRoutes(
        assignedCampRoutes.filter(
          (r) => !(r.campId === camp.id && (r.routeId === route.id || r.routeName === route.name))
        )
      );
    } else {
      setAssignedCampRoutes([
        ...assignedCampRoutes,
        { campId: camp.id, campName: camp.name, routeId: route.id, routeName: route.name },
      ]);
      if (!assignedCampIds.includes(camp.id)) {
        setAssignedCampIds([...assignedCampIds, camp.id]);
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !name.trim()) {
      showToast("error", "아이디와 이름을 입력해주세요.");
      return;
    }
    if (!editingAdmin && !password.trim()) {
      showToast("error", "신규 등록 시 비밀번호는 필수입니다.");
      return;
    }

    try {
      if (editingAdmin) {
        await ApiService.updateAdmin(editingAdmin.id, {
          loginId: loginId.trim(),
          password: password.trim() || undefined,
          name: name.trim(),
          isMaster,
          isAllCampsAccessible,
          canCreate,
          canRead,
          canUpdate,
          canDelete,
          assignedCampIds: isAllCampsAccessible ? [] : assignedCampIds,
          assignedCampRoutes: isAllCampsAccessible ? [] : assignedCampRoutes,
        });
        showToast("success", "관리자 정보 및 권한이 수정되었습니다.");
      } else {
        await ApiService.createAdmin({
          companyId: currentUser.companyId,
          loginId: loginId.trim(),
          password: password.trim(),
          name: name.trim(),
          isMaster,
          isAllCampsAccessible,
          canCreate,
          canRead,
          canUpdate,
          canDelete,
          assignedCampIds: isAllCampsAccessible ? [] : assignedCampIds,
          assignedCampRoutes: isAllCampsAccessible ? [] : assignedCampRoutes,
        });
        showToast("success", "새 관리자가 등록되었습니다.");
      }
      setIsFormModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "저장에 실패했습니다.");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    try {
      await ApiService.deleteAdmin(deletingAdmin.id);
      showToast("success", `'${deletingAdmin.name}' 관리자가 삭제되었습니다.`);
      setDeletingAdmin(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 font-['Pretendard',sans-serif]">
      <ToastNotification toast={toastMessage} />

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
            <span>총괄관리자 전용: 관리자 & 권한 관리</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            회사 내 관리자 계정을 등록·수정·삭제하고, 담당 캠프/노선 및 C/R/U/D 세부 권한을 배정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
          <button
            onClick={loadData}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 관리자 등록</span>
          </button>
        </div>
      </div>

      {/* Admins Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && admins.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-sm font-medium">
            관리자 목록을 불러오는 중입니다...
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-sm font-medium">
            등록된 관리자가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">관리자명 / ID</th>
                  <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">구분</th>
                  <th className="py-3.5 px-4 sm:px-6">담당 캠프 & 라우터</th>
                  <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-center">C / R / U / D 권한</th>
                  <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">등록일자</th>
                  <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/70 transition">
                    {/* Admin Name & ID */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {admin.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {admin.name}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ID: {admin.loginId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      {admin.isMaster ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          총괄관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          일반관리자
                        </span>
                      )}
                    </td>

                    {/* Assigned Camps & Routes */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {admin.isAllCampsAccessible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          회사 전체 캠프 및 라우트 접근 가능
                        </span>
                      ) : (admin.assignedCampNames || []).length === 0 ? (
                        <span className="text-slate-400 text-xs italic">배정된 캠프 없음</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {admin.assignedCampNames?.map((cName, idx) => {
                            const relatedRoutes = (admin.assignedCampRoutes || [])
                              .filter((r) => r.campName === cName && r.routeName)
                              .map((r) => r.routeName);

                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold"
                              >
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {cName}
                                {relatedRoutes.length > 0 && (
                                  <span className="text-blue-300 text-[10px] ml-1">
                                    ({relatedRoutes.join(", ")})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Permissions Badges */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${admin.canCreate ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                          C
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${admin.canRead ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                          R
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${admin.canUpdate ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                          U
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${admin.canDelete ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                          D
                        </span>
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(admin.createdAt).toLocaleDateString("ko-KR")}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-[11px]"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => setDeletingAdmin(admin)}
                          disabled={admin.id === currentUser.adminId}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                            admin.id === currentUser.adminId
                              ? "border-slate-200 text-slate-300 cursor-not-allowed"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                          title={admin.id === currentUser.adminId ? "현재 로그인된 본인 계정은 삭제할 수 없습니다" : "삭제"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Form Modal (Add / Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>{editingAdmin ? "관리자 정보 및 권한 수정" : "신규 관리자 등록"}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    관리자 아이디 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="로그인 아이디 입력"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {editingAdmin ? "비밀번호 (변경 시에만 입력)" : "비밀번호 *"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingAdmin ? "변경하지 않으려면 빈칸 유지" : "비밀번호 입력"}
                      required={!editingAdmin}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    관리자 성명 / 직함 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동 팀장"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Master Admin Toggle */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">총괄관리자 권한 부여</span>
                    <span className="text-[11px] text-slate-500">
                      총괄관리자는 다른 모든 관리자를 등록/수정/삭제하고 전체 권한을 관리할 수 있습니다.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isMaster}
                  onChange={(e) => {
                    setIsMaster(e.target.checked);
                    if (e.target.checked) {
                      setIsAllCampsAccessible(true);
                      setCanCreate(true);
                      setCanRead(true);
                      setCanUpdate(true);
                      setCanDelete(true);
                    }
                  }}
                  className="w-5 h-5 text-amber-600 rounded cursor-pointer accent-amber-500"
                />
              </div>

              {/* CRUD Permissions */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">기능별 세부 권한 (CRUD)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canCreate}
                      onChange={(e) => setCanCreate(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">생성 (Create)</span>
                      <span className="text-[10px] text-slate-400">기사/배차 신규등록</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canRead}
                      onChange={(e) => setCanRead(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">조회 (Read)</span>
                      <span className="text-[10px] text-slate-400">목록 및 상세조회</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canUpdate}
                      onChange={(e) => setCanUpdate(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">수정 (Update)</span>
                      <span className="text-[10px] text-slate-400">배차변경/상태수정</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">삭제 (Delete)</span>
                      <span className="text-[10px] text-slate-400">기사 삭제 권한</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Camp & Route Scope */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">담당 캠프 & 라우터 접근 범위</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllCampsAccessible}
                      onChange={(e) => setIsAllCampsAccessible(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-bold text-blue-600 text-xs">회사 전체 캠프/라우터 접근 허용</span>
                  </label>
                </div>

                {!isAllCampsAccessible && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <p className="text-[11px] text-slate-500 font-medium">
                      관리자가 담당할 캠프를 선택하고, 필요 시 세부 라우터를 지정하세요 (여러 개 선택 가능).
                    </p>

                    {camps.length === 0 ? (
                      <div className="text-center py-4 text-slate-400">등록된 캠프가 없습니다.</div>
                    ) : (
                      <div className="space-y-3">
                        {camps.map((camp) => {
                          const isCampSelected = assignedCampIds.includes(camp.id);
                          const campRoutes = routes.filter((r) => r.campId === camp.id);

                          return (
                            <div
                              key={camp.id}
                              className={`p-3.5 rounded-xl border transition ${
                                isCampSelected
                                  ? "bg-white border-blue-300 shadow-2xs"
                                  : "bg-slate-100/70 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={isCampSelected}
                                    onChange={() => toggleCampSelection(camp.id)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                  />
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                  <span>{camp.name}</span>
                                </label>

                                {isCampSelected && (
                                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    캠프 배정됨
                                  </span>
                                )}
                              </div>

                              {/* Routes under this camp */}
                              {isCampSelected && campRoutes.length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 pl-6 flex flex-wrap gap-2">
                                  {campRoutes.map((route) => {
                                    const isRouteSelected = assignedCampRoutes.some(
                                      (r) =>
                                        r.campId === camp.id &&
                                        (r.routeId === route.id || r.routeName === route.name)
                                    );

                                    return (
                                      <button
                                        type="button"
                                        key={route.id}
                                        onClick={() => toggleRouteSelection(camp, route)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                          isRouteSelected
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                      >
                                        <MapPin className="w-3 h-3 opacity-70" />
                                        <span>{route.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition"
                >
                  {editingAdmin ? "수정 완료" : "관리자 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">관리자 계정 삭제</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-slate-800">{deletingAdmin.name}</strong> ({deletingAdmin.loginId}) 관리자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingAdmin(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-xs"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAdmin}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20 transition text-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
