import React, { useState } from 'react';
import { X, UserCheck, Calendar, MapPin, Building2, UserX, Search } from 'lucide-react';
import { Driver } from '../../models/driver.model';
import { SlotAssignment } from '../../viewmodels/useScheduleViewModel';
import { StatusBadge } from '../components/StatusBadge';

interface RouteAssignModalProps {
  isOpen: boolean;
  dateStr: string;
  routeKey: string;
  campName: string;
  routeName: string;
  currentAssignment?: SlotAssignment;
  availableDrivers: Driver[];
  getDriverAssignmentOnDate?: (dateStr: string, driverId: number) => { routeKey: string } | undefined;
  onClose: () => void;
  onAssign: (driverId: number) => Promise<void>;
  onUnassign?: () => void | Promise<void>;
  onSetOffDay?: (driverId: number) => Promise<void>;
}

export const RouteAssignModal: React.FC<RouteAssignModalProps> = ({
  isOpen,
  dateStr,
  routeKey,
  campName,
  routeName,
  currentAssignment,
  availableDrivers,
  getDriverAssignmentOnDate,
  onClose,
  onAssign,
  onUnassign,
  onSetOffDay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredList = availableDrivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.driverCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = async (driverId: number) => {
    try {
      setSubmitting(true);
      await onAssign(driverId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOffDay = async () => {
    if (!currentAssignment || !onSetOffDay) return;
    try {
      setSubmitting(true);
      await onSetOffDay(currentAssignment.driverId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-300 font-bold">{dateStr}</span>
                <span className="text-slate-500">·</span>
                <span className="text-xs font-bold text-slate-300">{campName} / {routeName}</span>
              </div>
              <h3 className="font-bold text-lg leading-tight mt-0.5">
                구역 기사 배정
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

        {/* Current Assignment Bar (If assigned) */}
        {currentAssignment && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">현재 배정된 기사</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-slate-900 text-sm">{currentAssignment.driverName}</span>
                <StatusBadge status={currentAssignment.contractType as any} size="sm" />
                {currentAssignment.status === '휴무' && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">휴무</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSetOffDay && currentAssignment.status !== '휴무' && (
                <button
                  disabled={submitting}
                  onClick={handleOffDay}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                >
                  휴무 지정
                </button>
              )}
              {onUnassign && (
                <button
                  disabled={submitting}
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      await onUnassign();
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                >
                  배정 해제
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Driver */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="기사명, 전화번호, ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>
        </div>

        {/* Driver Selection List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <div className="text-xs font-bold text-slate-500 mb-2 px-1">
            가용 기사 목록 ({filteredList.length}명)
          </div>

          <div className="space-y-1.5">
            {filteredList.map((driver) => {
              const isSelected = currentAssignment?.driverId === driver.id;
              const otherAssignment = !isSelected && getDriverAssignmentOnDate
                ? getDriverAssignmentOnDate(dateStr, driver.id)
                : undefined;

              return (
                <div
                  key={driver.id}
                  onClick={() => !isSelected && !submitting && handleSelect(driver.id)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border border-blue-200 cursor-default'
                      : otherAssignment
                      ? 'bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50/80'
                      : 'hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  {/* Left: Driver info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {driver.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate">{driver.name}</span>
                        <StatusBadge status={driver.contractType} size="sm" />
                        {otherAssignment && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {otherAssignment.routeKey} 배정중
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[11px] text-slate-500 font-mono mt-0.5 truncate"
                        title={(() => {
                          const camps = (driver.camp || '').split(',').map(s => s.trim()).filter(Boolean);
                          const routes = (driver.routes || '').split(',').map(s => s.trim());
                          return camps.map((c, i) => (routes[i] ? `${c}/${routes[i]}` : c)).join(', ');
                        })()}
                      >
                        {(() => {
                          const camps = (driver.camp || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const routes = (driver.routes || '')
                            .split(',')
                            .map((s) => s.trim());
                          if (camps.length === 0) return '미지정';
                          return camps
                            .map((c, i) => (routes[i] ? `${c}/${routes[i]}` : c))
                            .join(', ');
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Assign Button */}
                  <button
                    disabled={isSelected || submitting}
                    className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition min-w-[70px] text-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : otherAssignment
                        ? 'border border-amber-300 bg-white text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                        : 'border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    }`}
                  >
                    {isSelected ? '배정됨' : otherAssignment ? '이동 배정' : '선택 배정'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
