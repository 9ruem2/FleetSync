import React, { useState, useEffect } from 'react';
import { Driver, CreateDriverForm, ContractType } from '../../models/driver.model';
import { Company, Camp, Route } from '../../models/master.model';
import { ApiService } from '../../services/apiService';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneFormat';
import { X, User, Phone, Briefcase, Hash, Building2, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';

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
  onSubmit: (form: CreateDriverForm) => Promise<void> | void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Companies & Camps when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      loadInitialData();
    }
  }, [isOpen, driver]);

  const loadInitialData = async () => {
    try {
      const [compList, campList] = await Promise.all([
        ApiService.getCompanies().catch(() => []),
        ApiService.getCamps().catch(() => []),
      ]);

      setCompanies(compList);
      const sortedCamps = [...campList].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setAvailableCamps(sortedCamps);

      let compId = driver?.companyId;
      if (!compId && compList.length > 0) {
        const daeguk = compList.find(c => c.name === '대국') || compList[0];
        compId = daeguk.id;
      }
      setSelectedCompanyId(compId);

      // 기사 정보가 있는 경우 폼 초기화
      if (driver) {
        setName(driver.name);
        setPhone(formatPhoneNumber(driver.phone));
        setDriverCode(driver.driverCode || '');
        setContractType(driver.contractType);

        const camps = (driver.camp || '').split(',').map(s => s.trim()).filter(Boolean);
        const routes = (driver.routes || '').split(',').map(s => s.trim());

        if (camps.length > 0) {
          // 각 캠프에 대한 라우터 목록 병렬 로드
          const initialSelections: CampRouteSelection[] = await Promise.all(
            camps.map(async (cName, i) => {
              const rName = routes[i] || '';
              const matchedCamp = sortedCamps.find(c => c.name.toLowerCase() === cName.toLowerCase());
              let rList: Route[] = [];
              if (matchedCamp) {
                try {
                  rList = await ApiService.getRoutes(matchedCamp.id);
                } catch {
                  rList = [];
                }
              }
              return {
                campId: matchedCamp?.id,
                campName: cName,
                routeName: rName,
                availableRoutes: rList,
              };
            })
          );
          setCampRoutes(initialSelections);
        } else {
          setCampRoutes([{ campName: '', routeName: '', availableRoutes: [] }]);
        }
      } else {
        setName('');
        setPhone('');
        setDriverCode('');
        setContractType('고정');
        setCampRoutes([{ campName: '', routeName: '', availableRoutes: [] }]);
      }
    } catch (err) {
      console.error('[loadInitialData error]:', err);
    }
  };

  // Handle Camp selection change in a row
  const handleCampSelect = async (index: number, campName: string) => {
    if (!campName) {
      setCampRoutes(prev => prev.map((cr, i) => i === index ? { ...cr, campId: undefined, campName: '', routeId: undefined, routeName: '', availableRoutes: [] } : cr));
      return;
    }

    const matchedCamp = availableCamps.find(c => c.name === campName);
    let rList: Route[] = [];
    if (matchedCamp) {
      try {
        rList = await ApiService.getRoutes(matchedCamp.id);
      } catch (err) {
        console.error(err);
      }
    }

    const sortedRoutes = [...rList].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    setCampRoutes(prev => prev.map((cr, i) => i === index ? {
      ...cr,
      campId: matchedCamp?.id,
      campName,
      routeId: undefined,
      routeName: '', // 캠프가 변경되면 라우터 초기화
      availableRoutes: sortedRoutes,
    } : cr));
  };

  // Handle Route selection change in a row
  const handleRouteSelect = (index: number, routeName: string) => {
    setCampRoutes(prev => prev.map((cr, i) => i === index ? {
      ...cr,
      routeName,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    try {
      setIsSubmitting(true);
      await onSubmit({
        companyId: selectedCompanyId,
        driverCode: driverCode.trim(),
        name: name.trim(),
        phone: normalizePhoneNumber(phone),
        camp: validPairs.map(p => p.campName).join(','),
        routes: validPairs.map(p => p.routeName).join(','),
        contractType
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedPairs = campRoutes.filter(cr => cr.campName.trim() && cr.routeName.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">
                {driver ? '기사 정보 수정' : '신규 기사 등록'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">기본 인적사항 및 배정 캠프/라우트를 지정하세요.</p>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 소속 회사 선택 */}
          {companies.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                소속 회사 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
                <select
                  disabled={isSubmitting}
                  value={selectedCompanyId || ''}
                  onChange={e => setSelectedCompanyId(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none cursor-pointer disabled:opacity-50"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 기사명 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              기사명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                disabled={isSubmitting}
                type="text"
                required
                placeholder="예: 김쿠팡"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
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
                disabled={isSubmitting}
                type="text"
                required
                placeholder="010-1234-5678"
                value={phone}
                onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {/* 담당 캠프 및 라우트 (1:1 Multi-Row Selection) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                담당 캠프 및 라우터 지정 <span className="text-red-500">*</span>
              </label>
              <button
                disabled={isSubmitting}
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-2 py-1 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>캠프/라우트 추가</span>
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
                    disabled={isSubmitting}
                    value={cr.campName || ''}
                    onChange={e => handleCampSelect(index, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer min-w-0 disabled:opacity-50"
                  >
                    <option value="">캠프 선택</option>
                    {/* 현재 기사가 가진 campName이 availableCamps에 없는 경우에도 option 포함 */}
                    {cr.campName && !availableCamps.some(c => c.name === cr.campName) && (
                      <option value={cr.campName}>{cr.campName}</option>
                    )}
                    {availableCamps.map(c => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* 라우터 드롭다운 (현재 선택된 라우터가 완벽하게 유지됨) */}
                  <select
                    disabled={!cr.campName || isSubmitting}
                    value={cr.routeName || ''}
                    onChange={e => handleRouteSelect(index, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-2 outline-none transition min-w-0 ${
                      !cr.campName
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : cr.campName && !cr.routeName
                        ? 'bg-red-50 border-red-300 focus:ring-red-400 cursor-pointer'
                        : 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white cursor-pointer'
                    }`}
                  >
                    <option value="">
                      {!cr.campName ? '캠프선택필요' : '라우터 선택'}
                    </option>
                    {/* 현재 선택된 routeName이 목록에 없더라도 즉시 옵션으로 포함하여 선택값 유지 */}
                    {cr.routeName && !cr.availableRoutes.some(r => r.name === cr.routeName) && (
                      <option value={cr.routeName}>{cr.routeName}</option>
                    )}
                    {cr.availableRoutes.map(r => (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={isSubmitting}
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="flex items-center justify-center w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[11px] shadow-xs"
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
                disabled={isSubmitting}
                value={contractType}
                onChange={e => setContractType(e.target.value as ContractType)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none cursor-pointer disabled:opacity-50"
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
                disabled={isSubmitting}
                type="text"
                placeholder="실제 업무 기사 ID (선택사항)"
                value={driverCode}
                onChange={e => setDriverCode(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
              />
            </div>
            {driver && (
              <p className="text-[11px] text-slate-400 mt-1">시스템 키 번호: #{driver.id}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              disabled={isSubmitting}
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              취소
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{driver ? '수정 중...' : '기사 등록 중...'}</span>
                </>
              ) : (
                <span>{driver ? '수정 완료' : '신규 기사 등록'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
