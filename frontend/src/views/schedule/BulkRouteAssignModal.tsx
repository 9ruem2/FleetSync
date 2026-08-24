import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Driver } from '../../models/driver.model';
import { RouteColumn, DateRowInfo } from '../../viewmodels/useScheduleViewModel';
import { StatusBadge } from '../components/StatusBadge';
import {
  WEEK_DAYS,
  CYCLE_ORDER,
  isDateMatchingFixedHoliday,
  getDriverFixedHolidayOnDate,
} from '../../utils/fixedHolidayUtils';

interface BulkRouteAssignModalProps {
  isOpen: boolean;
  driver: Driver | null;
  dateRows: DateRowInfo[];
  availableCamps: string[];
  routeColumns: RouteColumn[];
  onClose: () => void;
  onBulkAssign: (
    driverId: number,
    targetDates: string[],
    routeKey: string
  ) => Promise<void>;
}

export const BulkRouteAssignModal: React.FC<BulkRouteAssignModalProps> = ({
  isOpen,
  driver,
  dateRows,
  availableCamps,
  routeColumns,
  onClose,
  onBulkAssign,
}) => {
  const [weekCycle, setWeekCycle] = useState<string>('매주');
  const [selectedDays, setSelectedDays] = useState<string[]>(['월', '화', '수', '목', '금']);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [excludeFixedHolidays, setExcludeFixedHolidays] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 기사 변경 시 기본 캠프 및 라우트 자동 세팅
  useEffect(() => {
    if (driver) {
      const driverCamps = (driver.camp || '').split(',').map((s) => s.trim()).filter(Boolean);
      const driverRoutes = (driver.routes || '').split(',').map((s) => s.trim()).filter(Boolean);

      const initialCamp = driverCamps[0] || availableCamps[0] || '';
      setSelectedCamp(initialCamp);

      if (driverRoutes[0]) {
        setSelectedRoute(driverRoutes[0]);
      } else {
        const matchedCols = routeColumns.filter((c) => c.campName === initialCamp);
        setSelectedRoute(matchedCols[0]?.routeName || '');
      }

      // 기사의 고정 휴무가 있다면 해당 요일을 제외한 요일들을 기본 선택하거나 전체 평일 세팅
      if (driver.fixedHolidays && driver.fixedHolidays.length > 0) {
        setWeekCycle('매주');
        const holidayDays = new Set(
          driver.fixedHolidays.flatMap((h) => (h.dayOfWeek || '').split(',').map((s) => s.trim()))
        );
        const workDays = WEEK_DAYS.filter((d) => !holidayDays.has(d));
        setSelectedDays(workDays.length > 0 ? workDays : ['월', '화', '수', '목', '금']);
      } else {
        setSelectedDays(['월', '화', '수', '목', '금']);
      }
    }
  }, [driver, availableCamps, routeColumns]);

  // 선택된 캠프에 해당하는 라우터 목록
  const campAvailableRoutes = useMemo(() => {
    if (!selectedCamp) return [];
    const routes = routeColumns
      .filter((col) => col.campName === selectedCamp)
      .map((col) => col.routeName);
    return Array.from(new Set(routes)).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [selectedCamp, routeColumns]);

  // 캠프 변경 시 라우터 재조정
  const handleCampChange = (camp: string) => {
    setSelectedCamp(camp);
    const routes = routeColumns
      .filter((col) => col.campName === camp)
      .map((col) => col.routeName);
    setSelectedRoute(routes[0] || '');
  };

  // 요일 토글 핸들러
  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) => {
      let next: string[];
      if (prev.includes(day)) {
        next = prev.filter((d) => d !== day);
      } else {
        next = [...prev, day];
      }
      return next.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
    });
  };

  // 요일 전체 선택 / 해제
  const handleSelectAllDays = () => {
    if (selectedDays.length === WEEK_DAYS.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...WEEK_DAYS]);
    }
  };

  // 평일(월~금) 선택
  const handleSelectWeekdays = () => {
    setSelectedDays(['월', '화', '수', '목', '금']);
  };

  // 주말(토~일) 선택
  const handleSelectWeekends = () => {
    setSelectedDays(['토', '일']);
  };

  // 매칭되는 일자 계산
  const matchingDateRows = useMemo(() => {
    if (!driver || selectedDays.length === 0) return [];
    const daysStr = selectedDays.join(',');
    return dateRows.filter((r) =>
      isDateMatchingFixedHoliday(r.dateStr, weekCycle, daysStr)
    );
  }, [driver, dateRows, weekCycle, selectedDays]);

  // 고정 휴무와 충돌하는 일자 분류
  const { validDates, conflictDates } = useMemo(() => {
    if (!driver) return { validDates: [], conflictDates: [] };

    const valid: DateRowInfo[] = [];
    const conflict: { dateRow: DateRowInfo; holiday: any }[] = [];

    matchingDateRows.forEach((r) => {
      const holiday = getDriverFixedHolidayOnDate(driver, r.dateStr);
      if (holiday) {
        conflict.push({ dateRow: r, holiday });
        if (!excludeFixedHolidays) {
          valid.push(r);
        }
      } else {
        valid.push(r);
      }
    });

    return { validDates: valid, conflictDates: conflict };
  }, [driver, matchingDateRows, excludeFixedHolidays]);

  if (!isOpen || !driver) return null;

  const targetRouteKey = `${selectedCamp}/${selectedRoute}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp || !selectedRoute) {
      alert('배치할 캠프와 라우터를 선택해주세요.');
      return;
    }
    if (validDates.length === 0) {
      alert('조건에 매칭되는 배치 대상 날짜가 없습니다. 주차와 요일을 확인해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const targetDateStrings = validDates.map((r) => r.dateStr);
      await onBulkAssign(driver.id, targetDateStrings, targetRouteKey);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base">{driver.name} 기사</span>
                <StatusBadge status={driver.contractType} size="sm" />
                <span className="text-xs text-slate-400 font-mono">
                  ({driver.driverCode || 'ID 없음'})
                </span>
              </div>
              <h3 className="font-bold text-xs text-indigo-300 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                정기 패턴 노선 일괄 자동 배치
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. 배치할 노선 구역 (캠프 & 라우터) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. 배치 대상 노선 구역 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  담당 캠프
                </span>
                <select
                  disabled={submitting}
                  value={selectedCamp}
                  onChange={(e) => handleCampChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">캠프 선택</option>
                  {availableCamps.map((camp) => (
                    <option key={camp} value={camp}>
                      {camp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  라우터 (구역)
                </span>
                <select
                  disabled={submitting || !selectedCamp}
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden disabled:opacity-50"
                >
                  <option value="">라우터 선택</option>
                  {campAvailableRoutes.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. 주차 및 요일 패턴 설정 */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                2. 근무 주기 및 요일 패턴
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectWeekdays}
                  className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50"
                >
                  평일
                </button>
                <button
                  type="button"
                  onClick={handleSelectWeekends}
                  className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50"
                >
                  주말
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  전체
                </button>
              </div>
            </div>

            {/* 주차 선택 드롭다운 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 shrink-0">
                주차 선택:
              </span>
              <select
                disabled={submitting}
                value={weekCycle}
                onChange={(e) => setWeekCycle(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {CYCLE_ORDER.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 요일 버튼 그룹 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">
                  근무 요일 선택 <span className="text-[10px] text-indigo-600 font-normal">(복수 선택)</span>:
                </span>
                <span className="text-[11px] font-extrabold text-indigo-600">
                  {selectedDays.length > 0
                    ? `선택됨: ${selectedDays.join(', ')}`
                    : '선택된 요일 없음'}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  const isSun = day === '일';
                  const isSat = day === '토';
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleToggleDay(day)}
                      className={`py-2 text-xs font-extrabold rounded-xl transition text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50'
                          : isSun
                          ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                          : isSat
                          ? 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. 고정 휴무 충돌 안내 및 옵션 */}
          {conflictDates.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>고정 휴무일({conflictDates.length}일)이 포함되어 있습니다.</span>
              </div>
              <p className="text-[11px] text-amber-800">
                {conflictDates.map((c) => c.dateRow.formattedDate).join(', ')}은 기사의 정기 고정 휴무일입니다.
              </p>
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200/70 text-xs font-bold text-amber-950">
                <input
                  type="checkbox"
                  checked={excludeFixedHolidays}
                  onChange={(e) => setExcludeFixedHolidays(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <span>고정 휴무일은 노선 배치에서 자동 제외 (권장)</span>
              </label>
            </div>
          )}

          {/* 4. 일괄 배치 대상 날짜 실시간 미리보기 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                배치 대상 일자 미리보기:
              </span>
              <span className="font-extrabold text-indigo-600">
                총 {validDates.length}일 배치 예정
              </span>
            </div>

            {validDates.length === 0 ? (
              <div className="p-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                선택된 조건에 해당하는 날짜가 없습니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {validDates.map((r) => (
                  <span
                    key={r.dateStr}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {r.formattedDate}
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition disabled:opacity-50 shadow-2xs"
          >
            취소
          </button>
          <button
            type="button"
            disabled={submitting || validDates.length === 0 || !selectedCamp || !selectedRoute}
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {submitting
              ? '일괄 배치 중...'
              : `[${selectedCamp || '캠프'}/${selectedRoute || '구역'}]에 ${validDates.length}개 일자 일괄 배치`}
          </button>
        </div>
      </div>
    </div>
  );
};
