import React, { useState, useEffect } from 'react';
import { Driver, CreateDriverForm, ContractType } from '../../models/driver.model';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { X, User, Phone, Briefcase, Hash, Building2, MapPin, Plus, Trash2 } from 'lucide-react';

interface CampRoute {
  camp: string;
  route: string;
}

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
  const [campRoutes, setCampRoutes] = useState<CampRoute[]>([{ camp: '', route: '' }]);
  const [contractType, setContractType] = useState<ContractType>('고정');

  useEffect(() => {
    if (driver) {
      setDriverCode(driver.driverCode || '');
      setName(driver.name);
      setPhone(formatPhoneNumber(driver.phone));
      setContractType(driver.contractType);

      // 기존 camp, routes 데이터를 pair 배열로 복원
      const camps = (driver.camp || '').split(',').map(s => s.trim()).filter(Boolean);
      const routes = (driver.routes || '').split(',').map(s => s.trim());
      if (camps.length > 0) {
        setCampRoutes(camps.map((c, i) => ({ camp: c, route: routes[i] || '' })));
      } else {
        setCampRoutes([{ camp: '', route: '' }]);
      }
    } else {
      setDriverCode('');
      setName('');
      setPhone('');
      setCampRoutes([{ camp: '', route: '' }]);
      setContractType('고정');
    }
  }, [driver, isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: 'camp' | 'route', value: string) => {
    setCampRoutes(prev => prev.map((cr, i) => i === index ? { ...cr, [field]: value } : cr));
  };

  const handleAddRow = () => {
    setCampRoutes(prev => [...prev, { camp: '', route: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (campRoutes.length === 1) {
      setCampRoutes([{ camp: '', route: '' }]);
    } else {
      setCampRoutes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('기사명과 연락처는 필수 입력 항목입니다.');
      return;
    }

    const validPairs = campRoutes.filter(cr => cr.camp.trim());
    if (validPairs.length === 0) {
      alert('담당 캠프를 하나 이상 입력해주세요.');
      return;
    }
    const missingRoute = validPairs.find(cr => !cr.route.trim());
    if (missingRoute) {
      alert(`'${missingRoute.camp}' 캠프의 라우트를 입력해주세요.`);
      return;
    }

    onSubmit({
      driverCode: driverCode.trim(),
      name: name.trim(),
      phone: normalizePhoneNumber(phone),
      camp: validPairs.map(cr => cr.camp.trim()).join(','),
      routes: validPairs.map(cr => cr.route.trim()).join(','),
      contractType
    });
  };

  const completedPairs = campRoutes.filter(cr => cr.camp.trim() && cr.route.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>{driver ? '기사 정보 수정' : '신규 기사 등록'}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* 기사명 */}
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

          {/* 연락처 */}
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

          {/* 담당 캠프 / 라우트 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                담당 캠프 / 라우트 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition border border-blue-200"
              >
                <Plus className="w-3 h-3" />
                캠프/라우트 추가
              </button>
            </div>

            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-1.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 캠프명
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 라우트 <span className="text-red-400">(필수)</span>
              </span>
              <span />
            </div>

            {/* 입력 행들 */}
            <div className="space-y-2">
              {campRoutes.map((cr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center"
                >
                  <input
                    type="text"
                    placeholder="서울1캠프"
                    value={cr.camp}
                    onChange={e => handleChange(index, 'camp', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition min-w-0"
                  />
                  <input
                    type="text"
                    placeholder="101A"
                    value={cr.route}
                    onChange={e => handleChange(index, 'route', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 outline-none transition min-w-0 ${cr.camp.trim() && !cr.route.trim()
                        ? 'bg-red-50 border-red-300 focus:ring-red-400'
                        : 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="flex items-center justify-center w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* 인라인 미리보기 */}
            {completedPairs.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">선택된 캠프/라우트</p>
                <div className="flex flex-wrap gap-1.5">
                  {completedPairs.map((cr, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[11px] shadow-sm"
                    >
                      <Building2 className="w-3 h-3 opacity-70" />
                      {cr.camp}
                      <span className="opacity-40 mx-0.5">·</span>
                      <MapPin className="w-3 h-3 opacity-70" />
                      {cr.route}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 계약 형태 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              계약 형태 <span className="text-red-500">*</span>
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

          {/* 사용 ID */}
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
