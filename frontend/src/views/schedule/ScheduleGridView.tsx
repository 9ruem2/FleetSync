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
} from "lucide-react";
import { useScheduleViewModel } from "../../viewmodels/useScheduleViewModel";
import { ToastNotification } from "../components/ToastNotification";
import { RouteAssignModal } from "./RouteAssignModal";
import { ScheduleFinalizeModal } from "./ScheduleFinalizeModal";
import { StatusBadge } from "../components/StatusBadge";

export const ScheduleGridView: React.FC = () => {
  const vm = useScheduleViewModel();
  const [draggedDriverId, setDraggedDriverId] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null); // "date_routeKey"
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isMobileDriversOpen, setIsMobileDriversOpen] = useState(false);

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
    setDraggedDriverId(driverId);
  };

  const handleDragEnd = () => {
    setDraggedDriverId(null);
    setDragOverSlot(null);
  };

  const handleDropOnSlot = async (dateStr: string, routeKey: string) => {
    if (draggedDriverId !== null) {
      await vm.handleAssignDriver(dateStr, routeKey, draggedDriverId);
      setDraggedDriverId(null);
      setDragOverSlot(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Top Banner / Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>노선 배차 관리</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                날짜별 각 캠프 및 라우터 구역에 기사를 드래그하여 배정하고
                일정을 편성합니다.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Date Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Weekly / Monthly Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => vm.setViewMode("weekly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                vm.viewMode === "weekly"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              주간
            </button>
            <button
              onClick={() => vm.setViewMode("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                vm.viewMode === "monthly"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              월간
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => handleDateShift("prev")}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-bold text-xs sm:text-sm text-slate-900 font-mono">
              {vm.dateRows[0]?.dateStr} ~{" "}
              {vm.dateRows[vm.dateRows.length - 1]?.dateStr}
            </span>

            <button
              onClick={() => handleDateShift("next")}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={vm.reload}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            title="새로고침"
          >
            <RotateCcw
              className={`w-4 h-4 ${vm.loading ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
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

          {/* 안내 배너 (모바일에서는 펼쳐졌을 때만 표시, PC는 항상 표시) */}
          <div
            className={`${
              isMobileDriversOpen ? "flex" : "hidden lg:flex"
            } p-3 bg-blue-50/50 border-b border-blue-100 items-center gap-2 text-[11px] text-blue-800`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span>
              날짜/구역 셀로 <strong>드래그</strong>하거나 클릭하여 배정하세요.
            </span>
          </div>

          {/* Draggable Drivers List (모바일에서는 접었다 폈다 가능, PC는 항상 표시) */}
          <div
            className={`${
              isMobileDriversOpen ? "block" : "hidden lg:block"
            } p-3 space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto`}
          >
            {vm.unassignedDrivers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                표시할 기사가 없습니다.
              </div>
            ) : (
              vm.unassignedDrivers.map((driver) => {
                const isDragging = draggedDriverId === driver.id;
                return (
                  <div
                    key={driver.id}
                    draggable
                    onDragStart={() => handleDragStart(driver.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-xl border transition select-none cursor-grab active:cursor-grabbing ${
                      isDragging
                        ? "opacity-40 border-dashed border-blue-400 bg-blue-50"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {driver.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
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

                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Date-Route Matrix Schedule Table */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold divide-x divide-slate-800">
                  {/* Sticky Date Column Header - 고정 너비 (160px) */}
                  <th className="py-3.5 px-4 w-[160px] min-w-[160px] max-w-[160px] sticky left-0 z-20 bg-slate-900 shadow-md">
                    날짜
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
                            e.preventDefault();
                            setDragOverSlot(slotKey);
                          }}
                          onDragLeave={() => {
                            if (dragOverSlot === slotKey) setDragOverSlot(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropOnSlot(row.dateStr, col.key);
                          }}
                          onClick={() => {
                            vm.setSelectedSlot({
                              dateStr: row.dateStr,
                              routeKey: col.key,
                              campName: col.campName,
                              routeName: col.routeName,
                              currentAssignment: assignment,
                            });
                          }}
                          className={`p-2 text-center border-r border-slate-100 transition cursor-pointer relative ${
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
                                    {assignment.driverName} (휴무)
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-xs sm:text-sm text-emerald-950">
                                      {assignment.backupDriverName}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      대차완료
                                    </span>
                                  </div>
                                </>
                              ) : assignment.status === "휴무" ? (
                                /* 2. 휴무 + 대차 미지정 (결원 발생 중) 상태 */
                                <>
                                  <span className="font-bold text-xs sm:text-sm text-red-600 line-through">
                                    {assignment.driverName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                                      대차 미지정
                                    </span>
                                  </div>
                                </>
                              ) : (
                                /* 3. 정상 근무 배정 */
                                <>
                                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                                    {assignment.driverName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <StatusBadge
                                      status={assignment.contractType as any}
                                      size="sm"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="py-2.5 text-slate-300 hover:text-blue-500 flex items-center justify-center gap-1 transition">
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-[11px]">배정</span>
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

      {/* Bottom Main Action CTA Banner: 화면 최하단 대형 확정 및 배차표 발급 버튼 */}
      <div className="pt-2 pb-4">
        <button
          onClick={() => setIsFinalizeModalOpen(true)}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 active:scale-[0.99] transition-all flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 group border border-blue-400/30 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200 group-hover:scale-110 transition-transform" />
            <span>{vm.selectedDate.slice(0, 7)} 노선 배차표 최종 확정 및 발급</span>
          </div>
          <span className="hidden sm:inline text-blue-200/80 font-normal text-xs">
            (DB 안전 저장 및 기사별 PDF / 이미지 배차표 발급)
          </span>
          <Download className="w-4 h-4 text-blue-200 hidden sm:block group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

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

      {/* Monthly Schedule Finalize & Driver PDF/PNG Export Modal */}
      <ScheduleFinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        targetMonth={vm.selectedDate.slice(0, 7)}
        drivers={vm.drivers}
        assignments={vm.slotAssignments}
        onSavedSuccess={() => {
          vm.showToast("success", "근무표가 성공적으로 저장 및 승인되었습니다.");
        }}
      />
    </div>
  );
};
