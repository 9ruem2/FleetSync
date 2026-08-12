import React from 'react';
import { Search, Filter } from 'lucide-react';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
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
  contractTypeFilter,
  onContractTypeChange,
  routeFilter,
  onRouteChange,
  availableRoutes,
  onReset,
}) => {
  const hasFilters = searchTerm || contractTypeFilter || routeFilter;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="기사명(초성), 연락처, 라우트 검색..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
        />
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">필터:</span>
        </div>

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

        <select
          value={routeFilter}
          onChange={e => onRouteChange(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
        >
          <option value="">라우트 (전체)</option>
          {availableRoutes.map(route => (
            <option key={route} value={route}>
              라우트 {route}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-blue-600 hover:underline px-2"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
};
