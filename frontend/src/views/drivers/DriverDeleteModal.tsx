import React from 'react';
import { Driver } from '../../models/driver.model';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DriverDeleteModal: React.FC<Props> = ({
  isOpen,
  driver,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            기사 삭제 확인 (Soft Delete) [F-01-04]
          </h3>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            <strong className="text-slate-800">{driver.name}</strong> ({driver.routeNumber} / {driver.contractType}) 기사의 정보를 삭제하시겠습니까?
          </p>

          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-[11px] text-amber-800 leading-snug">
            💡 <strong>소프트 삭제(Soft Delete) 안내:</strong> 기존 스케줄 및 휴무 히스토리 보존을 위해 완전 삭제 대신 소프트 삭제 처리됩니다.
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="w-1/2 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition"
            >
              삭제 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
