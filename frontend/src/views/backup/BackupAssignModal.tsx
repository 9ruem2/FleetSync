import React from 'react';
import { useBackupViewModel } from '../../viewmodels/useBackupViewModel';
import { formatPhoneNumber } from '../../utils/phoneFormat';
import { StatusBadge } from '../components/StatusBadge';
import { UserCheck, X, AlertCircle, Phone, MapPin, Calendar, FileText } from 'lucide-react';

interface Props {
  target: {
    date: string;
    routeNumber: string;
    originalDriverId: number;
    originalDriverName: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BackupAssignModal: React.FC<Props> = ({
  target,
  onClose,
  onSuccess
}) => {
  const vm = useBackupViewModel(target, () => {
    onSuccess();
    onClose();
  });

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>대차(백업 기사) 지정</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              휴무가 발생한 라우트에 대체 근무할 백업 기사를 선택하여 배정합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Target Info Summary */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                대상 라우트: {target.routeNumber}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                {target.date}
              </span>
            </div>
            <div className="text-amber-800 flex items-center gap-2">
              <span>원 담당기사 (휴무):</span>
              <strong className="text-red-700 underline font-bold">{target.originalDriverName}</strong>
            </div>
          </div>

          {vm.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{vm.error}</span>
            </div>
          )}

          {/* Candidate Selection List */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              대차 가능 기사 선택 <span className="text-red-500">*</span>
            </label>

            {vm.loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                해당 날짜에 근무 가능한 백업 기사를 검색 중...
              </div>
            ) : vm.candidates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                해당 날짜에 대차 지정 가능한 기사가 존재하지 않습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {vm.candidates.map(candidate => {
                  const isSelected = vm.selectedBackupId === candidate.id;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => vm.setSelectedBackupId(candidate.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="backupDriver"
                          checked={isSelected}
                          onChange={() => vm.setSelectedBackupId(candidate.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{candidate.name}</span>
                            <StatusBadge status={candidate.contractType} size="sm" />
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {formatPhoneNumber(candidate.phone)}
                            </span>
                            <span>기본 라우트: {candidate.routeNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              메모 및 참고 사항 (선택)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="예: 야간 물량 지원 대차, 긴급 매칭 완료"
                value={vm.note}
                onChange={e => vm.setNote(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="button"
              disabled={vm.submitting || !vm.selectedBackupId}
              onClick={vm.handleAssignBackup}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              {vm.submitting ? '매칭 중...' : '대차 지정 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
