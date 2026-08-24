import React from 'react';
import { AlertTriangle, Calendar, User, MapPin, X } from 'lucide-react';

interface FixedHolidayConfirmModalProps {
  isOpen: boolean;
  driverName: string;
  dateStr: string;
  fixedHolidayInfo?: {
    weekCycle: string;
    dayOfWeek: string;
  };
  targetRouteName?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export const FixedHolidayConfirmModal: React.FC<FixedHolidayConfirmModalProps> = ({
  isOpen,
  driverName,
  dateStr,
  fixedHolidayInfo,
  targetRouteName,
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-amber-950">
                고정 휴무자 노선 배치 확인
              </h3>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                해당 날짜에 정기 고정 휴무로 지정된 기사입니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-amber-600 hover:text-amber-950 rounded-xl hover:bg-amber-100/60 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">기사명</span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {driverName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">배치 일자</span>
              <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {dateStr}
              </span>
            </div>
            {targetRouteName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">대상 노선</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {targetRouteName}
                </span>
              </div>
            )}
            {fixedHolidayInfo && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">고정 휴무 규칙</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[11px]">
                  {fixedHolidayInfo.weekCycle} {fixedHolidayInfo.dayOfWeek}요일 휴무
                </span>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
            <p className="text-xs text-amber-900 font-bold leading-relaxed">
              <span className="text-amber-700 underline font-extrabold">{driverName}</span> 기사님은 휴무일입니다.<br />
              정말로 이 노선에 <span className="text-indigo-700 font-extrabold">배치</span>하시겠습니까?
            </p>
          </div>
        </div>

        {/* Footer Actions: 취소 / 배치 */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50 shadow-2xs"
          >
            취소
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-50 shadow-xs flex items-center justify-center gap-1"
          >
            {loading ? '배치 중...' : '배치'}
          </button>
        </div>
      </div>
    </div>
  );
};
