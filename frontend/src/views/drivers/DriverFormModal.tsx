import React, { useState, useEffect, useMemo } from 'react';
import { Driver, CreateDriverForm, ContractType } from '../../models/driver.model';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { parseCamps } from '../../utils/routeUtils';
import { X, User, Phone, Briefcase, Hash, Building2, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSubmit: (form: CreateDriverForm) => void;
}

export const DriverFormModal: React.FC<Props> = ({
  isOpen,
  driver,
  onClose,
  onSubmit
}) => {
  const [driverCode, setDriverCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [camp, setCamp] = useState('');
  const [campInput, setCampInput] = useState('');
  const [contractType, setContractType] = useState<ContractType>('고정');

  useEffect(() => {
    if (driver) {
      setDriverCode(driver.driverCode || '');
      setName(driver.name);
      setPhone(formatPhoneNumber(driver.phone));
      setCamp(driver.camp || '');
      setCampInput('');
      setContractType(driver.contractType);
    } else {
      setDriverCode('');
      setName('');
      setPhone('');
      setCamp('');
      setCampInput('');
      setContractType('고정');
    }
  }, [driver, isOpen]);

  const camps = useMemo(() => parseCamps(camp), [camp]);

  if (!isOpen) return null;

  const handleAddCamp = () => {
    const trimmed = campInput.trim();
    if (!trimmed) return;
    const existing = parseCamps(camp);
    if (existing.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCampInput('');
      return;
    }
    const next = existing.length > 0 ? `${camp},${trimmed}` : trimmed;
    setCamp(next);
    setCampInput('');
  };

  const handleCampInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAddCamp();
    }
  };

  const handleRemoveCamp = (target: string) => {
    const next = parseCamps(camp).filter(c => c !== target).join(',');
    setCamp(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('기사명과 연락처는 필수 입력 항목입니다.');
      return;
    }
    if (camps.length === 0) {
      alert('담당 캠프를 하나 이상 입력해주세요.');
      return;
    }

    onSubmit({
      driverCode: driverCode.trim(),
      name: name.trim(),
      phone: normalizePhoneNumber(phone),
      camp: camp.trim(),
      contractType
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>{driver ? '기사 정보 수정' : '신규 기사 등록'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* 1. 기사명 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              기사명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* 2. 연락처 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="010-1234-5678"
                value={phone}
                onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* 3. 담당 캠프 (복수) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              담당 캠프 <span className="text-red-500">*</span>
              <span className="ml-1 text-slate-400 font-normal normal-case">(복수선택가능)</span>
            </label>

            {/* 캠프 태그 목록 */}
            {camps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {camps.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 font-bold rounded-lg text-xs border border-blue-200/80"
                  >
                    <Building2 className="w-3 h-3" />
                    {c}
                    <button
                      type="button"
                      onClick={() => handleRemoveCamp(c)}
                      className="ml-0.5 text-blue-400 hover:text-red-500 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 캠프 입력 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="캠프명 입력 후 추가 또는 Enter"
                  value={campInput}
                  onChange={e => setCampInput(e.target.value)}
                  onKeyDown={handleCampInputKeyDown}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCamp}
                className="flex items-center gap-1 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm shadow-blue-500/20 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </div>
          </div>

          {/* 4. 계약 형태 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              계약 형태 선택 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <select
                value={contractType}
                onChange={e => setContractType(e.target.value as ContractType)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none cursor-pointer"
              >
                <option value="고정">고정</option>
                <option value="용차">용차</option>
                <option value="백업">백업</option>
              </select>
            </div>
          </div>

          {/* 5. 사용 ID (선택) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              사용 ID <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="실제 업무 기사 ID (선택사항)"
                value={driverCode}
                onChange={e => setDriverCode(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            {driver && (
              <p className="text-[11px] text-slate-400 mt-1">시스템 키 번호: #{driver.id}</p>
            )}
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
            >
              {driver ? '수정 완료' : '신규 기사 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
