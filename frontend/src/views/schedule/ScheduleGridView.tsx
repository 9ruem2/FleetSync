import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  Search,
  Filter,
  GripVertical,
  Plus,
  Building2,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Save,
  FileText,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useScheduleViewModel } from "../../viewmodels/useScheduleViewModel";
import { ToastNotification } from "../components/ToastNotification";
import { RouteAssignModal } from "./RouteAssignModal";
import { ScheduleFinalizeModal } from "./ScheduleFinalizeModal";
import { BulkRouteAssignModal } from "./BulkRouteAssignModal";
import { StatusBadge } from "../components/StatusBadge";
import { FixedHolidayConfirmModal } from "../components/FixedHolidayConfirmModal";
import { getDriverFixedHolidayOnDate } from "../../utils/fixedHolidayUtils";
import { Driver } from "../../models/driver.model";

import { UserSession } from "../../models/user.model";
import { SaveProgressModal } from "./SaveProgressModal";

export const ScheduleGridView: React.FC = () => {
  const vm = useScheduleViewModel();
  const [draggedDriverId, setDraggedDriverId] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null); // "date_routeKey"
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isMobileDriversOpen, setIsMobileDriversOpen] = useState(false);
  const [bulkAssignDriver, setBulkAssignDriver] = useState<Driver | null>(null);
  const [dragConfirmData, setDragConfirmData] = useState<{
    driver: Driver;
    dateStr: string;
    routeKey: string;
  } | null>(null);

  // Load session permissions
  const session: UserSession | null = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("fleetsync_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const canUpdate = vm.canUpdate;
  const canCreate = vm.canCreate;
  const canDelete = vm.canDelete;

  // 날짜 이전/다음 이동 핸들러
  const handleDateShift = (direction: "prev" | "next") => {
    const [y, m, d] = vm.selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const days = vm.viewMode === "weekly" ? 7 : 30;
    date.setDate(date.getDate() + (direction === "next" ? days : -days));
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, "0");
    const nextD = String(date.getDate()).padStart(2, "0");
    vm.setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  // 드래그 앤 드롭 이벤트
  const handleDragStart = (driverId: number) => {
    if (!canUpdate) return;
    setDraggedDriverId(driverId);
  };

  const handleDragEnd = () => {
    setDraggedDriverId(null);
    setDragOverSlot(null);
  };

  const handleDropOnSlot = async (dateStr: string, routeKey: string) => {
    if (!canUpdate) return;
    if (draggedDriverId !== null) {
      const driver = vm.drivers.find((d) => d.id === draggedDriverId);
      const fixedHoliday = getDriverFixedHolidayOnDate(driver, dateStr);
      if (driver && fixedHoliday) {
        setDragConfirmData({ driver, dateStr, routeKey });
        setDraggedDriverId(null);
        setDragOverSlot(null);
        return;
      }

      await vm.handleAssignDriver(dateStr, routeKey, draggedDriverId);
      setDraggedDriverId(null);
      setDragOverSlot(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Previous Month Read-Only Notice */}
      {vm.isPreviousMonth && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              🔒 이전달({vm.selectedDate.slice(0, 7)}) 근무표는 조회 및 배차표
              발급 전용입니다. (수정, 삭제 및 배치는 불가합니다)
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100/80 border border-amber-300 text-amber-800">
            읽기 전용
          </span>
        </div>
      )}


      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* 헤더 행: 타이틀 + 뷰/날짜 컨트롤 */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          {/* 타이틀 */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CalendarIcon style={{ width: "16px", height: "16px" }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">노선 배차 관리</h2>
                {vm.isPreviousMonth && (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200 whitespace-nowrap">
                    조회 전용
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden md:block truncate">
                {vm.isPreviousMonth
                  ? "이전달 배차표 조회 및 기사별 PDF/이미지 발급 화면입니다."
                  : "기사를 드래그하여 날짜별 구역에 배정하고 일정을 편성합니다."}
              </p>
            </div>
          </div>

          {/* 뷰 전환 + 날짜 내비게이터 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Weekly / Monthly Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => vm.setViewMode("weekly")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition ${
                  vm.viewMode === "weekly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                주간
              </button>
              <button
                onClick={() => vm.setViewMode("monthly")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition ${
                  vm.viewMode === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                월간
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleDateShift("prev")}
                className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                title="이전"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 sm:px-3 text-[10px] sm:text-xs font-bold text-slate-800 font-mono whitespace-nowrap border-x border-slate-200 py-1.5">
                {vm.dateRows[0]?.dateStr} ~ {vm.dateRows[vm.dateRows.length - 1]?.dateStr}
              </span>
              <button
                onClick={() => handleDateShift("next")}
                className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                title="다음"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 액션 버튼 행: 왼쪽 3개 묶음 | 오른쪽 초기화 단독 */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-slate-50/70">
          {/* 왼쪽: 정기패턴 + 저장 + 배차표발급 */}
          <div className="flex items-center gap-1.5">
            {canUpdate && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "등록된 모든 기사의 1,3주/2,4주 정기 패턴에 따라 현재 기간의 배차표를 일괄 자동 배치하시겠습니까?",
                    )
                  ) {
                    vm.handleAutoAssignAllRegularPatterns();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-200 hover:bg-violet-100 text-violet-700 font-bold text-xs transition whitespace-nowrap"
                title="기사별 정기 노선 패턴에 맞춰 현재 달력에 일괄 자동 배치"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">정기패턴 배차</span>
                <span className="sm:hidden">패턴배차</span>
              </button>
            )}

            {canUpdate && (
              <button
                disabled={vm.isSavingRoster}
                onClick={vm.handleSaveMonthlySchedule}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                title="현재 편성된 근무표를 DB에 저장"
              >
                {vm.isSavingRoster ? (
                  <RotateCcw className="w-3 h-3 animate-spin shrink-0" />
                ) : (
                  <Save className="w-3 h-3 shrink-0" />
                )}
                <span>{vm.isSavingRoster ? "저장 중..." : "근무표 저장"}</span>
              </button>
            )}

            <button
              onClick={() => setIsFinalizeModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition whitespace-nowrap"
              title="기사별 PDF / 이미지 배차표 발급"
            >
              <FileText className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="hidden sm:inline">배차표 발급</span>
              <span className="sm:hidden">배차표</span>
            </button>
          </div>

          {/* 오른쪽: 초기화 단독 */}
          {canUpdate && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `현재 화면(${vm.selectedDate.slice(0, 7)})에 편성된 모든 노선 배정을 전체 초기화하시겠습니까?\n\n* 초기화 후 [근무 확정 저장]을 누르면 DB에도 완전히 반영됩니다.`,
                  )
                ) {
                  vm.handleResetAllAssignments();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold text-xs transition whitespace-nowrap"
              title="현재 기간의 모든 슬롯 배정 내역 전체 초기화"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>


      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="기사명, 연락처, 초성 검색..."
              value={vm.searchTerm}
              onChange={(e) => vm.setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Camp Filter */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={vm.campFilter}
              onChange={(e) => vm.setCampFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-medium"
            >
              <option value="">전체 캠프</option>
              {vm.availableCamps.map((camp) => (
                <option key={camp} value={camp}>
                  {camp}
                </option>
              ))}
            </select>
          </div>

          {/* Route Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={vm.routeFilter}
              onChange={(e) => vm.setRouteFilter(e.target.value)}
              disabled={!vm.campFilter}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-medium disabled:opacity-50"
            >
              <option value="">전체 라우트</option>
              {vm.availableRoutes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={vm.contractTypeFilter}
              onChange={(e) => vm.setContractTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-medium"
            >
              <option value="">전체 계약 형태</option>
              <option value="고정">고정</option>
              <option value="용차">용차</option>
              <option value="백업">백업</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout or Loading Skeleton */}
      {vm.loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-20 flex flex-col items-center justify-center gap-4 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              노선 배차 데이터를 불러오는 중입니다...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              담당 캠프, 라우트 구역, 기사 배정 및 근무 상태를 최신 정보로
              동기화하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Content Layout: Left (Unassigned Drivers) + Right (Date-Route Matrix) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Side: Unassigned Drivers Panel */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              {/* Header (모바일에서는 클릭하여 접기/펼치기 토글) */}
              <div
                onClick={() => setIsMobileDriversOpen(!isMobileDriversOpen)}
                className="p-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer lg:cursor-default select-none"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">가용 기사</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                    {vm.unassignedDrivers.length}명
                  </span>
                </div>

                {/* Mobile Accordion Toggle Indicator */}
                <div className="lg:hidden flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span>{isMobileDriversOpen ? "접기" : "기사 목록 보기"}</span>
                  {isMobileDriversOpen ? (
                    <ChevronUp className="w-4 h-4 text-white" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* 안내 배너 */}
              <div
                className={`${
                  isMobileDriversOpen ? "flex" : "hidden lg:flex"
                } p-3 bg-blue-50/50 border-b border-blue-100 flex-col gap-1 text-[11px] text-blue-900`}
              >
                <div className="flex items-center gap-1.5 font-bold text-blue-800">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span>배차 및 일괄 배치 방법</span>
                </div>
                <p className="text-[10px] text-blue-700 leading-tight">
                  기사를 마우스로 <strong>드래그</strong>하여 우측 원하는 날짜의
                  구역에 <strong>드롭</strong>하면 배정됩니다. (기사 카드를
                  클릭하면 일괄 배치도 가능합니다)
                </p>
              </div>

              {/* Driver List */}
              <div
                className={`${
                  isMobileDriversOpen ? "block" : "hidden lg:block"
                } p-3 space-y-2 max-h-[480px] overflow-y-auto`}
              >
                {vm.unassignedDrivers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    {vm.searchTerm ||
                    vm.contractTypeFilter ||
                    vm.campFilter ||
                    vm.routeFilter
                      ? "검색 조건에 맞는 기사가 없습니다."
                      : "가용한 기사가 없습니다."}
                  </div>
                ) : (
                  vm.unassignedDrivers.map((driver) => {
                    const isDragging = draggedDriverId === driver.id;
                    return (
                      <div
                        key={driver.id}
                        draggable={canUpdate}
                        onDragStart={() => {
                          if (canUpdate) handleDragStart(driver.id);
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={() => setBulkAssignDriver(driver)}
                        title={
                          canUpdate
                            ? "클릭하여 기사 근무/휴무 정보 조회 (드래그하여 노선에 직접 배정 가능)"
                            : "클릭하여 기사 근무/휴무 정보 조회 (읽기 전용)"
                        }
                        className={`p-3 rounded-xl border transition select-none ${
                          canUpdate ? "cursor-pointer" : "cursor-default"
                        } group relative ${
                          isDragging
                            ? "opacity-40 border-dashed border-blue-400 bg-blue-50 cursor-grabbing"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                              {driver.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {driver.name}
                                </span>
                                <StatusBadge
                                  status={driver.contractType}
                                  size="sm"
                                />
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                {(() => {
                                  const camps = (driver.camp || "")
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  const routes = (driver.routes || "")
                                    .split(",")
                                    .map((s) => s.trim());
                                  if (camps.length === 0) return "미지정";
                                  return camps
                                    .map((c, i) =>
                                      routes[i] ? `${c}/${routes[i]}` : c,
                                    )
                                    .join(", ");
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBulkAssignDriver(driver);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                                title="일괄 배치 모달 열기"
                              >
                                <span>배치</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side: Matrix (Y-Axis: Date, X-Axis: Routes) */}
            <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs font-bold border-b border-slate-800">
                      {/* Y-Axis Label Header - 고정 너비 (160px) */}
                      <th className="py-3.5 px-4 w-[160px] min-w-[160px] max-w-[160px] sticky left-0 z-20 bg-slate-900 border-r border-slate-800 shadow-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>날짜 (일정)</span>
                        </div>
                      </th>

                      {/* Route Columns Headers (X-Axis: e.g. 남3/905CD, 남4/605D ...) */}
                      {vm.routeColumns.map((col) => (
                        <th
                          key={col.key}
                          className="py-3.5 px-3 text-center min-w-[130px] font-mono tracking-tight"
                        >
                          <div className="text-amber-300 font-bold text-xs sm:text-sm">
                            {col.displayName}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 text-xs">
                    {vm.dateRows.map((row) => (
                      <tr
                        key={row.dateStr}
                        className="hover:bg-slate-50/70 transition group"
                      >
                        {/* Y-Axis Date Cell - 고정 너비 (160px) */}
                        <td
                          className={`py-3 px-4 w-[160px] min-w-[160px] max-w-[160px] sticky left-0 z-10 border-r border-slate-200 font-bold shadow-xs whitespace-nowrap ${
                            row.isWeekend
                              ? "bg-amber-50/80 text-amber-900"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-blue-600 opacity-80" />
                              <span className="text-xs sm:text-sm">
                                {row.formattedDate}
                              </span>
                            </div>
                            {row.weekLabel && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs tracking-tight">
                                {row.weekLabel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Route Slots for this Date */}
                        {vm.routeColumns.map((col) => {
                          const assignment = vm.getSlotAssignment(
                            row.dateStr,
                            col.key,
                          );
                          const slotKey = `${row.dateStr}_${col.key}`;
                          const isDragOver = dragOverSlot === slotKey;

                          return (
                            <td
                              key={col.key}
                              onDragOver={(e) => {
                                if (!canUpdate) return;
                                e.preventDefault();
                                setDragOverSlot(slotKey);
                              }}
                              onDragLeave={() => {
                                if (dragOverSlot === slotKey)
                                  setDragOverSlot(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (!canUpdate) return;
                                handleDropOnSlot(row.dateStr, col.key);
                              }}
                              onClick={() => {
                                if (!canUpdate) return;
                                vm.setSelectedSlot({
                                  dateStr: row.dateStr,
                                  routeKey: col.key,
                                  campName: col.campName,
                                  routeName: col.routeName,
                                  currentAssignment: assignment,
                                });
                              }}
                              className={`p-2 text-center border-r border-slate-100 transition relative ${
                                canUpdate ? "cursor-pointer" : "cursor-default"
                              } ${
                                isDragOver
                                  ? "bg-blue-100/80 ring-2 ring-blue-500 ring-inset"
                                  : assignment?.status === "휴무"
                                    ? assignment.backupDriverId
                                      ? "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70"
                                      : "bg-red-50/90 border-red-200 ring-1 ring-red-300/80 hover:bg-red-100/80"
                                    : assignment
                                      ? "hover:bg-blue-50/50"
                                      : "hover:bg-slate-100/60"
                              }`}
                            >
                              {assignment ? (
                                <div className="flex flex-col items-center justify-center gap-1 py-1">
                                  {/* 1. 휴무 + 대차 완료 상태 */}
                                  {assignment.status === "휴무" &&
                                  assignment.backupDriverId ? (
                                    <>
                                      <span className="text-[10px] text-slate-400 line-through">
                                        {assignment.driverName}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-extrabold text-emerald-700 text-xs">
                                          {assignment.backupDriverName}
                                        </span>
                                        <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                                          대차
                                        </span>
                                      </div>
                                    </>
                                  ) : assignment.status === "휴무" ? (
                                    /* 2. 휴무 + 대차 미지정 (결원 발생) */
                                    <>
                                      <span className="text-[10px] text-slate-400 line-through">
                                        {assignment.driverName}
                                      </span>
                                      <span className="text-[10px] font-bold text-red-600 animate-pulse bg-red-100/80 px-1.5 py-0.5 rounded">
                                        대차 미지정
                                      </span>
                                    </>
                                  ) : (
                                    /* 3. 일반 배정 (고정 / 용차) */
                                    <>
                                      <span className="font-bold text-slate-900 text-xs">
                                        {assignment.driverName}
                                      </span>
                                      <StatusBadge
                                        status={
                                          (assignment.contractType ||
                                            assignment.status) as any
                                        }
                                        size="sm"
                                      />
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-300 font-mono py-2 select-none group-hover:text-slate-400 transition">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer (근무표 DB 저장 & 발급) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {canUpdate && (
              <button
                onClick={vm.handleSaveMonthlySchedule}
                disabled={vm.isSavingRoster}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-5 h-5 text-emerald-200" />
                <span>
                  {vm.isSavingRoster
                    ? "DB에 저장 중..."
                    : `${vm.selectedDate.slice(0, 7)} 근무표 저장`}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsFinalizeModalOpen(true)}
              className={`w-full ${
                canUpdate
                  ? "sm:flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } py-4 px-6 rounded-2xl font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer`}
            >
              <FileText className="w-5 h-5 text-blue-300" />
              <span>{vm.selectedDate.slice(0, 7)} 이미지 저장</span>
              <Download className="w-4 h-4 text-blue-300" />
            </button>
          </div>
        </>
      )}

      {/* Slot Assign & State Change Modal */}
      {vm.selectedSlot && (
        <RouteAssignModal
          isOpen={true}
          dateStr={vm.selectedSlot.dateStr}
          routeKey={vm.selectedSlot.routeKey}
          campName={vm.selectedSlot.campName}
          routeName={vm.selectedSlot.routeName}
          currentAssignment={vm.selectedSlot.currentAssignment}
          availableDrivers={vm.drivers}
          getDriverAssignmentOnDate={vm.getDriverAssignmentOnDate}
          onClose={() => vm.setSelectedSlot(null)}
          onAssign={async (driverId: number) => {
            if (vm.selectedSlot) {
              await vm.handleAssignDriver(
                vm.selectedSlot.dateStr,
                vm.selectedSlot.routeKey,
                driverId,
              );
            }
          }}
          onUnassign={() => {
            if (vm.selectedSlot) {
              vm.handleUnassignDriver(
                vm.selectedSlot.dateStr,
                vm.selectedSlot.routeKey,
              );
            }
          }}
          onSetOffDay={async (driverId: number) => {
            if (vm.selectedSlot) {
              await vm.handleSetOffDay(
                vm.selectedSlot.dateStr,
                vm.selectedSlot.routeKey,
                driverId,
              );
            }
          }}
          onAssignBackup={async (backupDriverId: number) => {
            if (vm.selectedSlot) {
              await vm.handleAssignBackup(
                vm.selectedSlot.dateStr,
                vm.selectedSlot.routeKey,
                backupDriverId,
              );
            }
          }}
          onRemoveBackup={() => {
            if (vm.selectedSlot) {
              vm.handleRemoveBackup(
                vm.selectedSlot.dateStr,
                vm.selectedSlot.routeKey,
              );
            }
          }}
        />
      )}

      {/* Monthly Schedule Driver PDF/PNG Export Modal */}
      <ScheduleFinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        targetMonth={vm.selectedDate.slice(0, 7)}
        drivers={vm.drivers}
        assignments={vm.slotAssignments}
      />

      {/* 드래그 앤 드롭 고정 휴무자 노선 배치 확인 팝업 (취소 / 배치) */}
      <FixedHolidayConfirmModal
        isOpen={!!dragConfirmData}
        driverName={dragConfirmData?.driver.name || ""}
        dateStr={dragConfirmData?.dateStr || ""}
        targetRouteName={dragConfirmData?.routeKey || ""}
        fixedHolidayInfo={
          dragConfirmData
            ? getDriverFixedHolidayOnDate(
                dragConfirmData.driver,
                dragConfirmData.dateStr,
              )
            : undefined
        }
        onClose={() => setDragConfirmData(null)}
        onConfirm={async () => {
          if (dragConfirmData) {
            await vm.handleAssignDriver(
              dragConfirmData.dateStr,
              dragConfirmData.routeKey,
              dragConfirmData.driver.id,
            );
            setDragConfirmData(null);
          }
        }}
      />

      {/* 기사 근무 및 휴무 패턴 상세 조회 모달 */}
      <BulkRouteAssignModal
        isOpen={!!bulkAssignDriver}
        driver={bulkAssignDriver}
        onClose={() => setBulkAssignDriver(null)}
        onAssignRegularPattern={
          canUpdate
            ? async (driverId) => {
                await vm.handleAssignSingleDriverRegularPattern(driverId);
              }
            : undefined
        }
      />

      {/* DB 저장 진행 상태 모달 */}
      <SaveProgressModal
        isOpen={vm.isSavingRoster || vm.saveProgress.step === "done" || vm.saveProgress.step === "error"}
        state={vm.saveProgress}
        targetMonth={vm.selectedDate.slice(0, 7)}
        onClose={() => {
          if (vm.saveProgress.step === "done") {
            vm.showToast("success", `${vm.selectedDate.slice(0, 7)} 근무표가 DB에 성공적으로 저장되었습니다.`);
          }
          vm.setSaveProgress({ step: "idle", totalItems: 0, insertedItems: 0 });
        }}
      />
    </div>
  );
};
