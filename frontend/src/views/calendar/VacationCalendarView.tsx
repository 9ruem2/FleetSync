import React, { useState } from "react";
import { useCalendarViewModel } from "../../viewmodels/useCalendarViewModel";
import { ToastNotification } from "../components/ToastNotification";
import { OffDayRecord } from "../../models/schedule.model";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar as CalendarIcon,
  Users,
  X,
  Building2,
  MapPin,
  UserCheck,
  UserX,
  ArrowRight,
} from "lucide-react";

export const VacationCalendarView: React.FC = () => {
  const vm = useCalendarViewModel();

  // 모바일/PC 클릭 시 상세 정보 모달용 상태
  const [detailModalData, setDetailModalData] = useState<{
    dateStr: string;
    dayNumber: number;
    records: OffDayRecord[];
  } | null>(null);

  const monthTitle = vm.currentDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const weekDayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Toast notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>휴무 현황 조회 (달력)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            월간 일자별 기사 휴무 현황 및 대차 상태를 한눈에 조회합니다. 날짜를 클릭하면 상세 배차 정보를 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
          <button
            onClick={vm.setTodayMonth}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
          >
            이번 달 ({monthTitle})
          </button>

          <button
            onClick={vm.reload}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Control Navigation Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={vm.prevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-slate-900 font-mono px-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
            <span>{monthTitle}</span>
          </div>

          <button
            onClick={vm.nextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>대차 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>대차 미지정 (결원)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FullCalendar Matrix Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {vm.loading ? (
          <div className="p-12 sm:p-16 text-center text-slate-400 text-sm font-medium">
            휴무 달력 데이터를 로딩 중입니다...
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[720px] sm:min-w-[850px]">
              {/* Weekday Labels Header */}
              <div className="grid grid-cols-7 bg-slate-900 text-white text-xs font-bold text-center border-b border-slate-800">
                {weekDayNames.map((day, idx) => (
                  <div
                    key={day}
                    className={`py-2.5 sm:py-3.5 ${
                      idx === 0
                        ? "text-red-400"
                        : idx === 6
                          ? "text-amber-300"
                          : ""
                    }`}
                  >
                    <span>{day}요일</span>
                  </div>
                ))}
              </div>

              {/* Calendar Cells Matrix */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200">
                {vm.calendarGrid.map((cell, idx) => {
                  const isSunday = idx % 7 === 0;
                  const isSaturday = idx % 7 === 6;
                  const totalOffCount = cell.offDayRecords.length;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      onClick={() => {
                        if (totalOffCount > 0) {
                          setDetailModalData({
                            dateStr: cell.dateStr,
                            dayNumber: cell.dayNumber,
                            records: cell.offDayRecords,
                          });
                        }
                      }}
                      className={`min-h-[110px] sm:min-h-[135px] p-2 sm:p-2.5 bg-white flex flex-col justify-between select-none transition ${
                        totalOffCount > 0 ? "cursor-pointer hover:bg-slate-50/80" : ""
                      } ${!cell.isCurrentMonth ? "opacity-40 bg-slate-50" : ""} ${
                        cell.isToday ? "ring-2 ring-blue-500 ring-inset z-10" : ""
                      }`}
                    >
                      {/* Top Row: Date number & Total summary badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                            cell.isToday
                              ? "bg-blue-600 text-white"
                              : isSunday
                                ? "text-red-600 font-extrabold"
                                : isSaturday
                                  ? "text-blue-600 font-extrabold"
                                  : "text-slate-800"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Summary Off-day Count Badge */}
                        {totalOffCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shadow-2xs flex items-center gap-1">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>{totalOffCount}명</span>
                          </span>
                        )}
                      </div>

                      {/* Off-day Drivers Names List (Read Only - 사람 이름만 깔끔하게 표시) */}
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-28 sm:max-h-36 pr-0.5">
                        {cell.offDayRecords.map((record) => (
                          <div
                            key={record.id}
                            title={`${record.driverName}${record.displayRoute ? ` [${record.displayRoute}]` : ""}${
                              record.backupAssigned
                                ? ` (대차: ${record.backupDriverName})`
                                : " - 대차 미지정"
                            }`}
                            className={`px-2 py-1 rounded-lg border text-xs font-bold transition flex items-center justify-between gap-1 shadow-2xs ${
                              record.backupAssigned
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80"
                            }`}
                          >
                            {/* 사람 이름 표시: 대차 완료 시 [원기사 → 대차기사], 미지정 시 [원기사명] */}
                            <div className="truncate flex items-center gap-1 min-w-0">
                              {record.backupAssigned ? (
                                <>
                                  <span className="line-through text-emerald-700/60 font-medium text-[11px] truncate">
                                    {record.driverName}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 shrink-0">
                                    →
                                  </span>
                                  <span className="text-emerald-950 font-bold truncate">
                                    {record.backupDriverName}
                                  </span>
                                </>
                              ) : (
                                <span className="truncate text-red-800">
                                  {record.driverName}
                                </span>
                              )}
                            </div>

                            {/* 초소형 상태 도트 */}
                            {record.backupAssigned ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 휴무 및 대차 상세 팝업 모달 (모바일/PC 클릭 시 표시) */}
      {detailModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDetailModalData(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-xs text-blue-300 font-bold">
                    {detailModalData.dateStr}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mt-0.5">
                    일자별 휴무 및 대차 상세
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDetailModalData(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Off-Day & Backup Details */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-500">
                총 휴무 기사: {detailModalData.records.length}명
              </div>

              {detailModalData.records.map((rec, index) => (
                <div
                  key={rec.id || index}
                  className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                    rec.backupAssigned
                      ? "border-emerald-200 ring-1 ring-emerald-100"
                      : "border-red-200 ring-1 ring-red-100"
                  }`}
                >
                  {/* 1. 기사 정보 및 휴무 상태 */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {rec.driverName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{rec.driverName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            휴무
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 캠프 및 라우터 정보 */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{rec.displayRoute || rec.routeNumber}</span>
                    </div>
                  </div>

                  {/* 2. 대차(배차) 지정 완료 상태 상세 */}
                  {rec.backupAssigned ? (
                    <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            대차 지정 완료
                          </div>
                          <div className="text-sm font-extrabold text-emerald-950 mt-0.5 flex items-center gap-1">
                            <span>대차 기사:</span>
                            <span className="underline decoration-emerald-500 underline-offset-2">
                              {rec.backupDriverName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                        대차완료
                      </span>
                    </div>
                  ) : (
                    /* 대차 미지정 (결원) 상태 */
                    <div className="p-3 bg-red-50/90 rounded-xl border border-red-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-red-600 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                            대차 상태
                          </div>
                          <div className="text-xs font-bold text-red-900 mt-0.5">
                            대차 기사 미지정 (결원 발생 중)
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs">
                        대차 미지정
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailModalData(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                확인 (닫기)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
