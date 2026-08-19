import React, { useState, useEffect } from 'react';
import { Driver, CreateDriverForm, ContractType } from '../../models/driver.model';
import { Company, Camp, Route } from '../../models/master.model';
import { ApiService } from '../../services/apiService';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { X, User, Phone, Briefcase, Hash, Building2, MapPin, Plus, Trash2 } from 'lucide-react';

interface CampRouteSelection {
  campId?: number;
  campName: string;
  routeId?: number;
  routeName: string;
  availableRoutes: Route[];
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);

  const [availableCamps, setAvailableCamps] = useState<Camp[]>([]);

  const [driverCode, setDriverCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [campRoutes, setCampRoutes] = useState<CampRouteSelection[]>([
    { campName: '', routeName: '', availableRoutes: [] }
  ]);
  const [contractType, setContractType] = useState<ContractType>('고정');

  // Load Companies when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      const compList = await ApiService.getCompanies();
      setCompanies(compList);
      if (driver && driver.companyId) {
        setSelectedCompanyId(driver.companyId);
      } else if (compList.length > 0) {
        const daeguk = compList.find(c => c.name === '대국') || compList[0];
        setSelectedCompanyId(daeguk.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // When selected company changes, load available camps
  useEffect(() => {
    if (selectedCompanyId) {
      loadCamps(selectedCompanyId);
    } else {
      setAvailableCamps([]);
    }
  }, [selectedCompanyId]);

  const loadCamps = async (comp = selectedCompanyId) => {
    if (!comp) return;
    try {
      const campList = await ApiService.getCamps(comp);
      setAvailableCamps(campList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (driver) {
      setDriverCode(driver.driverCode || '');
      setName(driver.name);
      setPhone(formatPhoneNumber(driver.phone));
      setContractType(driver.contractType);
      if (driver.companyId) setSelectedCompanyId(driver.companyId);

      const camps = (driver.camp || '').split(',').map(s => s.trim()).filter(Boolean);
      const routes = (driver.routes || '').split(',').map(s => s.trim());

      if (camps.length > 0) {
        const initialSelections: CampRouteSelection[] = camps.map((c, i) => ({
          campName: c,
          routeName: routes[i] || '',
          availableRoutes: []
        }));
        setCampRoutes(initialSelections);
      } else {
        setCampRoutes([{ campName: '', routeName: '', availableRoutes: [] }]);
      }
    } else {
      setDriverCode('');
      setName('');
      setPhone('');
      setCampRoutes([{ campName: '', routeName: '', availableRoutes: [] }]);
      setContractType('고정');
    }
  }, [driver, isOpen]);

  if (!isOpen) return null;

  // Handle Camp selection change in a row
  const handleCampSelect = async (index: number, campObj: Camp | null) => {
    if (!campObj) {
      setCampRoutes(prev => prev.map((cr, i) => i === index ? { ...cr, campId: undefined, campName: '', routeId: undefined, routeName: '', availableRoutes: [] } : cr));
      return;
    }

    try {
      const routeList = await ApiService.getRoutes(campObj.id);
      setCampRoutes(prev => prev.map((cr, i) => i === index ? {
        ...cr,
        campId: campObj.id,
        campName: campObj.name,
        routeId: undefined,
        routeName: '',
        availableRoutes: routeList
      } : cr));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Route selection change in a row
  const handleRouteSelect = (index: number, routeObj: Route | null) => {
    setCampRoutes(prev => prev.map((cr, i) => i === index ? {
      ...cr,
      routeId: routeObj?.id,
      routeName: routeObj?.name || ''
    } : cr));
  };

  const handleAddRow = () => {
    setCampRoutes(prev => [...prev, { campName: '', routeName: '', availableRoutes: [] }]);
  };

  const handleRemoveRow = (index: number) => {
    if (campRoutes.length === 1) {
      setCampRoutes([{ campName: '', routeName: '', availableRoutes: [] }]);
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

    const validPairs = campRoutes.filter(cr => cr.campName.trim());
    if (validPairs.length === 0) {
      alert('담당 캠프를 하나 이상 선택해주세요.');
      return;
    }
    const missingRoute = validPairs.find(cr => !cr.routeName.trim());
    if (missingRoute) {
      alert(`'${missingRoute.campName}' 캠프의 라우트를 선택해주세요.`);
      return;
    }

    onSubmit({
      companyId: selectedCompanyId,
      driverCode: driverCode.trim(),
      name: name.trim(),
      phone: normalizePhoneNumber(phone),
      camp: validPairs.map(cr => cr.campName.trim()).join(','),
      routes: validPairs.map(cr => cr.routeName.trim()).join(','),
      contractType
    });
  };

  const completedPairs = campRoutes.filter(cr => cr.campName.trim() && cr.routeName.trim());

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
          {/* 소속 회사 선택 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              소속 회사 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <select
                value={selectedCompanyId || ''}
                onChange={e => setSelectedCompanyId(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
              >
                {companies.length === 0 ? (
                  <option value="">등록된 회사가 없습니다 (설정에서 추가)</option>
                ) : (
                  companies.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

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

          {/* 담당 캠프 / 라우트 (드롭다운 선택 방식) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                담당 캠프 / 라우터 선택 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition border border-blue-200"
              >
                <Plus className="w-3 h-3" />
                캠프/라우터 추가
              </button>
            </div>

            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-1.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 캠프 선택
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 라우터 선택 <span className="text-red-400">(필수)</span>
              </span>
              <span />
            </div>

            {/* 선택 행들 */}
            <div className="space-y-2">
              {campRoutes.map((cr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center"
                >
                  {/* 캠프 드롭다운 */}
                  <select
                    value={cr.campId || ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const found = availableCamps.find(c => c.id === id) || null;
                      handleCampSelect(index, found);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer min-w-0"
                  >
                    <option value="">캠프 선택</option>
                    {availableCamps.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* 라우터 드롭다운 */}
                  <select
                    value={cr.routeId || ''}
                    disabled={!cr.campId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const found = cr.availableRoutes.find(r => r.id === id) || null;
                      handleRouteSelect(index, found);
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-2 outline-none transition min-w-0 ${
                      !cr.campId
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : cr.campId && !cr.routeName
                        ? 'bg-red-50 border-red-300 focus:ring-red-400 cursor-pointer'
                        : 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white cursor-pointer'
                    }`}
                  >
                    <option value="">
                      {!cr.campId ? '캠프선택필요' : '라우터 선택'}
                    </option>
                    {cr.availableRoutes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

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
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">선택된 캠프/라우터</p>
                <div className="flex flex-wrap gap-1.5">
                  {completedPairs.map((cr, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[11px] shadow-sm"
                    >
                      <Building2 className="w-3 h-3 opacity-70" />
                      {cr.campName}
                      <span className="opacity-40 mx-0.5">·</span>
                      <MapPin className="w-3 h-3 opacity-70" />
                      {cr.routeName}
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
