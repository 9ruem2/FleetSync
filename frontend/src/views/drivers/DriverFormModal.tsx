import React, { useState, useEffect, useMemo } from 'react';
import { Driver, CreateDriverForm, ContractType, WeekPattern } from '../../models/driver.model';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { parseRoutes } from '../../utils/routeUtils';
import { RouteBadges } from '../components/RouteBadges';
import { X, User, Phone, MapPin, Briefcase, Hash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSubmit: (form: CreateDriverForm) => void;
}

const WEEK_PATTERN_OPTIONS: { value: WeekPattern; label: string; desc: string }[] = [
  { value: '1,3', label: '1,3주', desc: '매월 1·3주차에 담당' },
  { value: '2,4', label: '2,4주', desc: '매월 2·4주차에 담당' },
  { value: 'both', label: '1,3 + 2,4주', desc: '주차별로 다른 라우트 담당' },
];

export const DriverFormModal: React.FC<Props> = ({
  isOpen,
  driver,
  onClose,
  onSubmit
}) => {
  const [driverCode, setDriverCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [weekPattern, setWeekPattern] = useState<WeekPattern>('1,3');
  const [routesWeek13, setRoutesWeek13] = useState('');
  const [routesWeek24, setRoutesWeek24] = useState('');
  const [contractType, setContractType] = useState<ContractType>('고정');

  useEffect(() => {
    if (driver) {
      setDriverCode(driver.driverCode);
      setName(driver.name);
      setPhone(formatPhoneNumber(driver.phone));
      setWeekPattern(driver.weekPattern);
      setRoutesWeek13(driver.routesWeek13);
      setRoutesWeek24(driver.routesWeek24);
      setContractType(driver.contractType);
    } else {
      setDriverCode('');
      setName('');
      setPhone('');
      setWeekPattern('1,3');
      setRoutesWeek13('');
      setRoutesWeek24('');
      setContractType('고정');
    }
  }, [driver, isOpen]);

  const previewWeek13 = useMemo(() => parseRoutes(routesWeek13), [routesWeek13]);
  const previewWeek24 = useMemo(() => parseRoutes(routesWeek24), [routesWeek24]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverCode.trim() || !name.trim() || !phone.trim()) {
      alert('사용 ID, 기사명, 연락처는 필수입니다.');
      return;
    }
    if (weekPattern === '1,3' && !routesWeek13.trim()) {
      alert('1,3주 담당 라우트를 입력해주세요.');
      return;
    }
    if (weekPattern === '2,4' && !routesWeek24.trim()) {
      alert('2,4주 담당 라우트를 입력해주세요.');
      return;
    }
    if (weekPattern === 'both' && !routesWeek13.trim() && !routesWeek24.trim()) {
      alert('1,3주 또는 2,4주 담당 라우트를 입력해주세요.');
      return;
    }

    onSubmit({
      driverCode: driverCode.trim(),
      name: name.trim(),
      phone: normalizePhoneNumber(phone),
      routesWeek13: routesWeek13.trim(),
      routesWeek24: routesWeek24.trim(),
      weekPattern,
      contractType
    });
  };

  const showWeek13 = weekPattern === '1,3' || weekPattern === 'both';
  const showWeek24 = weekPattern === '2,4' || weekPattern === 'both';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              사용 ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="실제 업무에서 사용하는 기사 ID"
                value={driverCode}
                onChange={e => setDriverCode(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            {driver && (
              <p className="text-[11px] text-slate-400 mt-1">시스템 키 번호: #{driver.id}</p>
            )}
          </div>

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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              담당 주차 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WEEK_PATTERN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWeekPattern(opt.value)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                    weekPattern === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className={`text-[10px] font-normal mt-0.5 ${weekPattern === opt.value ? 'text-blue-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showWeek13 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                1,3주 담당 라우트 {weekPattern === '1,3' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="101A, 202B (쉼표로 구분)"
                  value={routesWeek13}
                  onChange={e => setRoutesWeek13(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              {previewWeek13.length > 0 && (
                <div className="mt-2">
                  <RouteBadges routes={previewWeek13} label="미리보기" />
                </div>
              )}
            </div>
          )}

          {showWeek24 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                2,4주 담당 라우트 {weekPattern === '2,4' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="301C, 402D (쉼표로 구분)"
                  value={routesWeek24}
                  onChange={e => setRoutesWeek24(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              {previewWeek24.length > 0 && (
                <div className="mt-2">
                  <RouteBadges routes={previewWeek24} label="미리보기" />
                </div>
              )}
            </div>
          )}

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
