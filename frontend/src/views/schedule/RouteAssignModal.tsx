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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>구역 기사 배정 및 상태 변경</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {dateStr}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  <Building2 className="w-3.5 h-3.5" />
                  {campName}
                  <span className="text-white/40">/</span>
                  <MapPin className="w-3.5 h-3.5" />
                  {routeName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Assigned Driver Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-semibold text-slate-500 mb-2">현재 배정된 담당 기사</div>
          {currentAssignment ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {currentAssignment.driverName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{currentAssignment.driverName}</span>
                    <StatusBadge status={currentAssignment.contractType as any} size="sm" />
                    {currentAssignment.status === '휴무' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        휴무
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">상태: {currentAssignment.status}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
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
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>배정 해제</span>
                  </button>
                )}

                {currentAssignment.status !== '휴무' && onSetOffDay && (
                  <button
                    disabled={submitting}
                    onClick={handleOffDay}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>휴무 지정</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
              현재 배정된 기사가 없습니다. 아래 목록에서 선택하거나 드래그하여 배정하세요.
            </div>
          )}
        </div>

        {/* Driver Selection List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">배정할 기사 선택 ({filteredList.length}명)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="기사명 또는 연락처 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
            {filteredList.map((driver) => {
              const isSelected = currentAssignment?.driverId === driver.id;
              return (
                <div
                  key={driver.id}
                  onClick={() => !isSelected && !submitting && handleSelect(driver.id)}
                  className={`p-3 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border border-blue-200 cursor-default'
                      : 'hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {driver.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{driver.name}</span>
                        <StatusBadge status={driver.contractType} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {driver.camp} · {driver.routes}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isSelected || submitting}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    }`}
                  >
                    {isSelected ? '배정됨' : '선택 배정'}
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
