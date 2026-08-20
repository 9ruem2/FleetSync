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
  getDriverAssignmentOnDate?: (dateStr: string, driverId: number) => { routeKey: string; isBackup?: boolean } | undefined;
  onClose: () => void;
  onAssign: (driverId: number) => Promise<void>;
  onUnassign?: () => void | Promise<void>;
  onSetOffDay?: (driverId: number) => Promise<void>;
  onAssignBackup?: (backupDriverId: number) => Promise<void>;
  onRemoveBackup?: () => void | Promise<void>;
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
  onAssignBackup,
  onRemoveBackup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'assign' | 'backup'>(() =>
    currentAssignment?.status === '휴무' ? 'backup' : 'assign'
  );

  if (!isOpen) return null;

  const isOffDay = currentAssignment?.status === '휴무';

  const filteredList = availableDrivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.driverCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = async (driverId: number) => {
    try {
      setSubmitting(true);
      if (isOffDay && onAssignBackup) {
        await onAssignBackup(driverId);
      } else {
        await onAssign(driverId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOffDay = async () => {
    if (!currentAssignment || !onSetOffDay) return;
    try {
      setSubmitting(true);
      await onSetOffDay(currentAssignment.driverId);
      setMode('backup');
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
                {isOffDay ? '휴무 및 대차 기사 지정' : '구역 기사 배정'}
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
          <div className={`p-4 border-b flex flex-col gap-3 ${
            isOffDay
              ? currentAssignment.backupDriverId
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-red-50/70 border-red-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  배정 기사 정보
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`font-bold text-sm ${isOffDay ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {currentAssignment.driverName}
                  </span>
                  <StatusBadge status={currentAssignment.contractType as any} size="sm" />
                  {isOffDay && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                      휴무
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onSetOffDay && !isOffDay && (
                  <button
                    disabled={submitting}
                    onClick={handleOffDay}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                  >
                    휴무 전환
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
                    전체 배정 해제
                  </button>
                )}
              </div>
            </div>

            {/* If Off-Day: Backup Status Bar */}
            {isOffDay && (
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    대차(대체 근무) 지정 현황
                  </div>
                  {currentAssignment.backupDriverId ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-medium">대차 기사:</span>
                      <span className="font-bold text-xs text-emerald-900">
                        {currentAssignment.backupDriverName}
                      </span>
                      {currentAssignment.backupContractType && (
                        <StatusBadge status={currentAssignment.backupContractType as any} size="sm" />
                      )}
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        대차완료
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span>대차 미지정 (결원 발생 중) - 아래 목록에서 대차 기사를 선택하세요.</span>
                    </div>
                  )}
                </div>

                {currentAssignment.backupDriverId && onRemoveBackup && (
                  <button
                    disabled={submitting}
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        await onRemoveBackup();
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                  >
                    대차 해제
                  </button>
                )}
              </div>
            )}
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
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 px-1">
            <span>
              {isOffDay ? '대차 가능 기사 선택' : '가용 기사 목록'} ({filteredList.length}명)
            </span>
            {isOffDay && (
              <span className="text-[11px] text-emerald-600 font-semibold">
                클릭 시 대차 기사로 즉시 배정됩니다
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {filteredList.map((driver) => {
              const isDirectSelected = currentAssignment?.driverId === driver.id;
              const isBackupSelected = currentAssignment?.backupDriverId === driver.id;
              const isSelected = isDirectSelected || isBackupSelected;

              const otherAssignment = !isSelected && getDriverAssignmentOnDate
                ? getDriverAssignmentOnDate(dateStr, driver.id)
                : undefined;

              return (
                <div
                  key={driver.id}
                  onClick={() => !isSelected && !submitting && handleSelect(driver.id)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? isBackupSelected
                        ? 'bg-emerald-50/80 border border-emerald-300 cursor-default'
                        : 'bg-blue-50/70 border border-blue-200 cursor-default'
                      : otherAssignment
                      ? 'bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50/80'
                      : 'hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  {/* Left: Driver info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      isBackupSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {driver.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate">{driver.name}</span>
                        <StatusBadge status={driver.contractType} size="sm" />
                        {isBackupSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            현재 대차 기사
                          </span>
                        )}
                        {otherAssignment && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {otherAssignment.routeKey} {otherAssignment.isBackup ? '대차중' : '배정중'}
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
                        ? isBackupSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-blue-600 text-white shadow-xs'
                        : isOffDay
                        ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white'
                        : otherAssignment
                        ? 'border border-amber-300 bg-white text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                        : 'border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    }`}
                  >
                    {isBackupSelected
                      ? '대차 배정됨'
                      : isDirectSelected
                      ? '배정됨'
                      : isOffDay
                      ? '대차 지정'
                      : otherAssignment
                      ? '이동 배정'
                      : '선택 배정'}
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
