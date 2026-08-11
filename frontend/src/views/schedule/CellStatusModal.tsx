import React from 'react';
import { ShiftStatus } from '../../models/schedule.model';
import { StatusBadge } from '../components/StatusBadge';
import { X, Calendar, MapPin, User, CheckCircle2, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  cell: {
    driverId: string;
    driverName: string;
    routeNumber: string;
    date: string;
    currentStatus: ShiftStatus;
    backupAssigned?: boolean;
    backupDriverName?: string;
  } | null;
  onClose: () => void;
  onSelectStatus: (status: ShiftStatus) => void;
  onOpenBackup: () => void;
}

export const CellStatusModal: React.FC<Props> = ({
  isOpen,
  cell,
  onClose,
  onSelectStatus,
  onOpenBackup
}) => {
  if (!isOpen || !cell) return null;

  const statusOptions: ShiftStatus[] = ['고정', '용차', '백업', '휴무'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">근무 상태 변경 [F-02-02]</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {cell.driverName}
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {cell.routeNumber}
              </span>
            </div>
            <div className="text-slate-500 font-mono">날짜: {cell.date}</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              변경할 상태 선택:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(status => {
                const isCurrent = cell.currentStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => onSelectStatus(status)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <StatusBadge status={status} size="sm" />
                    {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backup trigger button if status is 휴무 */}
          {cell.currentStatus === '휴무' && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onOpenBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-amber-700" />
                <span>
                  {cell.backupAssigned
                    ? `대차 변경 (현재: ${cell.backupDriverName})`
                    : '대차(백업 기사) 수동 지정 [F-02-06]'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
