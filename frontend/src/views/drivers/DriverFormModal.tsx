import React, { useState, useEffect, useMemo } from 'react';
import { Driver, CreateDriverForm, ContractType, WeekPattern } from '../../models/driver.model';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { parseRoutes, parseCamps } from '../../utils/routeUtils';
import { RouteBadges } from '../components/RouteBadges';
import { X, User, Phone, MapPin, Briefcase, Hash, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSubmit: (form: CreateDriverForm) => void;
}

const WEEK_PATTERN_OPTIONS: { value: WeekPattern; label: string; desc: string }[] = [
  { value: '1,3', label: '1,3주', desc: '매월 1·3주차에 담당' },
  { value: '2,4', label: '2,4주', desc: '매월 2·4주차에 담당' }
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
  const [camp, setCamp] = useState('');
  const [weekPattern, setWeekPattern] = useState<WeekPattern>('1,3');
  const [routesWeek13, setRoutesWeek13] = useState('');
  const [routesWeek24, setRoutesWeek24] = useState('');
  const [contractType, setContractType] = useState<ContractType>('고정');

  useEffect(() => {
    if (driver) {
      setDriverCode(driver.driverCode || '');
      setName(driver.name);
      setPhone(formatPhoneNumber(driver.phone));
      setCamp(driver.camp || '');
      setWeekPattern(driver.weekPattern);
      setRoutesWeek13(driver.routesWeek13);
      setRoutesWeek24(driver.routesWeek24);
      setContractType(driver.contractType);
    } else {
      setDriverCode('');
      setName('');
      setPhone('');
      setCamp('');
      setWeekPattern('1,3');
      setRoutesWeek13('');
      setRoutesWeek24('');
      setContractType('고정');
    }
  }, [driver, isOpen]);

  const previewCamps = useMemo(() => parseCamps(camp), [camp]);
  const previewWeek13 = useMemo(() => parseRoutes(routesWeek13), [routesWeek13]);
  const previewWeek24 = useMemo(() => parseRoutes(routesWeek24), [routesWeek24]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !camp.trim()) {
      alert('기사명, 연락처, 담당 캠프는 필수 입력 항목입니다.');
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
      camp: camp.trim(),
      routesWeek13: routesWeek13.trim(),
      routesWeek24: routesWeek24.trim(),
      weekPattern,
      contractType
    });
  };

  const showWeek13 = weekPattern === '1,3' || weekPattern === 'both';
  const showWeek24 = weekPattern === '2,4' || weekPattern === 'both';

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

          {/* 3. 담당 주차 (선택) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              담당 주차 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {WEEK_PATTERN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWeekPattern(opt.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left sm:text-center ${weekPattern === opt.value
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

          {/* 4. [담당 캠프, 담당 라우트] 한 줄에 표시 (Row Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            {/* Left Column: 담당 캠프 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                담당 캠프 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="서울1캠프"
                  value={camp}
                  onChange={e => setCamp(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              {previewCamps.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {previewCamps.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded text-[10px] border border-blue-200/80">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: 담당 라우트 */}
            <div className="space-y-2">
              {showWeek13 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    담당 라우트 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="101AB"
                      value={routesWeek13}
                      onChange={e => setRoutesWeek13(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  {previewWeek13.length > 0 && (
                    <div className="mt-1">
                      <RouteBadges routes={previewWeek13} label="1,3주" size="sm" />
                    </div>
                  )}
                </div>
              )}

              {showWeek24 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    담당 라우트 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="301CD"
                      value={routesWeek24}
                      onChange={e => setRoutesWeek24(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  {previewWeek24.length > 0 && (
                    <div className="mt-1">
                      <RouteBadges routes={previewWeek24} label="2,4주" size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. 계약 형태 */}
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

          {/* 6. 사용 ID (선택) */}
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
