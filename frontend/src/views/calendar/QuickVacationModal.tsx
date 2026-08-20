import React, { useState } from 'react';
import { Driver } from '../../models/driver.model';
import { X, Calendar, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  date: string | null;
  drivers: Driver[];
  onClose: () => void;
  onSubmit: (driverId: number, date: string) => void;
}

export const QuickVacationModal: React.FC<Props> = ({
  isOpen,
  date,
  drivers,
  onClose,
  onSubmit
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  if (!isOpen || !date) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      alert('휴무 등록할 기사를 선택해 주세요.');
      return;
    }
    onSubmit(selectedDriverId, date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-400" />
            <span>달력 기반 휴무 등록</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
            <span>선택한 일자:</span>
            <span className="text-blue-600 font-extrabold text-sm">{date}</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              휴무 기사 선택 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {drivers.map(driver => {
                const isSelected = selectedDriverId === driver.id;
                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${isSelected
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-sm text-slate-900">{driver.name}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-xs font-mono text-slate-600">
                      <span>ID: {driver.driverCode || '-'}</span>
                      <span className="text-blue-700">
                        {driver.routes || '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
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
              type="submit"
              disabled={!selectedDriverId}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-500/20 transition"
            >
              휴무 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
