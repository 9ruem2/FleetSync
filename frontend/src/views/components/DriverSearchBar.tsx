import React from 'react';
import { Search, Filter } from 'lucide-react';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  campFilter: string;
  onCampChange: (value: string) => void;
  availableCamps: string[];
  contractTypeFilter: string;
  onContractTypeChange: (value: string) => void;
  routeFilter: string;
  onRouteChange: (value: string) => void;
  availableRoutes: string[];
  onReset: () => void;
}

export const DriverSearchBar: React.FC<Props> = ({
  searchTerm,
  onSearchChange,
  campFilter,
  onCampChange,
  availableCamps,
  contractTypeFilter,
  onContractTypeChange,
  routeFilter,
  onRouteChange,
  availableRoutes,
  onReset,
}) => {
  const hasFilters = searchTerm || campFilter || contractTypeFilter || routeFilter;

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
      {/* 검색바 */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="기사명(초성), 연락처, 캠프 검색"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
        />
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col gap-2">
        {/* 필터 레이블 + 캠프(전체 너비) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">필터:</span>
          </div>
          {/* Camp Filter - 모바일에서 전체 너비 */}
          <select
            value={campFilter}
            onChange={e => {
              onCampChange(e.target.value);
              onRouteChange('');
            }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          >
            <option value="">캠프 (전체)</option>
            {availableCamps.map(camp => (
              <option key={camp} value={camp}>
                {camp}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1 shrink-0"
            >
              초기화
            </button>
          )}
        </div>

        {/* 라우트 + 계약 형태 - 2열 그리드 */}
        <div className="grid grid-cols-2 gap-2">
          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={e => onRouteChange(e.target.value)}
            disabled={!campFilter}
            title={!campFilter ? '라우트를 조회하려면 먼저 캠프를 선택해야 합니다.' : ''}
            className={`px-3 py-2 border rounded-xl text-xs font-semibold transition ${
              !campFilter
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer'
            }`}
          >
            <option value="">
              {!campFilter ? '라우트 (캠프선택필요)' : '라우트 (전체)'}
            </option>
            {availableRoutes.map(route => (
              <option key={route} value={route}>
                라우트 {route}
              </option>
            ))}
          </select>

          {/* Contract Type Filter */}
          <select
            value={contractTypeFilter}
            onChange={e => onContractTypeChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          >
            <option value="">계약 형태 (전체)</option>
            <option value="고정">고정</option>
            <option value="용차">용차</option>
            <option value="백업">백업</option>
          </select>
        </div>
      </div>
    </div>
  );
};
