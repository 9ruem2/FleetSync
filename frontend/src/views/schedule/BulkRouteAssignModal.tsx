import React from 'react';
import {
  X,
  Layers,
  Calendar,
  Building2,
  MapPin,
  Sparkles,
  Phone,
  CalendarDays,
  Coffee,
  Info,
} from 'lucide-react';
import { Driver } from '../../models/driver.model';
import { StatusBadge } from '../components/StatusBadge';
import { formatPhoneNumber } from '../../utils/phoneFormat';
import { getShortCampName } from '../../utils/routeUtils';

interface BulkRouteAssignModalProps {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onAssignRegularPattern?: (driverId: number) => Promise<void> | void;
}

export const BulkRouteAssignModal: React.FC<BulkRouteAssignModalProps> = ({
  isOpen,
  driver,
  onClose,
  onAssignRegularPattern,
}) => {
  if (!isOpen || !driver) return null;

  const routePatterns = driver.routePatterns || [];
  const fixedHolidays = driver.fixedHolidays || [];

  const handleApplyPattern = async () => {
    if (onAssignRegularPattern) {
      await onAssignRegularPattern(driver.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
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
                <CalendarDays className="w-3.5 h-3.5" />
                기사 등록 근무 및 고정 휴무 정보
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. 기사 기본 정보 요약 카드 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formatPhoneNumber(driver.phone)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>담당 캠프: {driver.camp || '미지정'}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">계약 형태</span>
              <StatusBadge status={driver.contractType} size="md" />
            </div>
          </div>

          {/* 2. 기사 관리에서 등록된 정기 근무 노선 패턴 (routePatterns) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                등록된 정기 근무 노선 패턴
              </label>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                총 {routePatterns.length}개 설정
              </span>
            </div>

            {routePatterns.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                기사 관리에 등록된 정기 노선 패턴이 없습니다.
                <br />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  (기사 관리 화면에서 수정 버튼을 눌러 정기 노선을 등록할 수 있습니다)
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {routePatterns.map((pattern, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 transition shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-100 shrink-0">
                        {pattern.weekCycle}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs shrink-0">
                        {pattern.dayOfWeek}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-right font-bold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        {pattern.campName} / {pattern.routeName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 기사 관리에서 등록된 고정 휴무일 (fixedHolidays) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-rose-600" />
                등록된 고정 휴무일
              </label>
              <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                총 {fixedHolidays.length}개 설정
              </span>
            </div>

            {fixedHolidays.length === 0 ? (
              <div className="p-3.5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                등록된 고정 휴무일이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {fixedHolidays.map((holiday, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between"
                  >
                    <span className="text-xs font-extrabold text-rose-700">
                      {holiday.weekCycle}
                    </span>
                    <div className="flex items-center gap-1">
                      {holiday.dayOfWeek.split(',').map((d, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-600 text-xs font-extrabold shadow-2xs"
                        >
                          {d.trim()}요일
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
          >
            닫기
          </button>

          {onAssignRegularPattern && routePatterns.length > 0 && (
            <button
              type="button"
              onClick={handleApplyPattern}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>등록된 정기 패턴으로 배차 자동 적용</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
