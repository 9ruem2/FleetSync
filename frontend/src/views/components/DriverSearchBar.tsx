import React from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";

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
  const hasFilters =
    searchTerm || campFilter || contractTypeFilter || routeFilter;
  const activeFilterCount = [
    campFilter,
    contractTypeFilter,
    routeFilter,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 검색 입력 영역 */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-blue-500">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="기사명(초성), 연락처, 캠프 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="px-4 py-3 bg-slate-50/60 flex flex-col md:flex-row md:items-center gap-2.5">
        {/* 필터 레이블 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">필터</span>
          </div>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4.5 h-4.5 min-w-[1.125rem] px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-full leading-none">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* 구분선 (PC only) */}
        <div className="hidden md:block w-px h-5 bg-slate-200 shrink-0" />

        {/* 드롭다운 3개 */}
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
          {/* 모바일: 캠프 + 초기화 */}
          <div className="flex items-center gap-2 md:flex-1">
            <select
              value={campFilter}
              onChange={(e) => {
                onCampChange(e.target.value);
                onRouteChange("");
              }}
              className={`flex-1 md:w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[center_right_0.75rem] pr-8 ${
                campFilter
                  ? "bg-blue-50 border-blue-300 text-blue-700 focus:ring-2 focus:ring-blue-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              }`}
            >
              <option value="">캠프 (전체)</option>
              {availableCamps.map((camp) => (
                <option key={camp} value={camp}>
                  {camp}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={onReset}
                className="md:hidden flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-2 rounded-xl shrink-0 transition-all"
              >
                <X className="w-3 h-3" />
                초기화
              </button>
            )}
          </div>

          {/* 라우트 + 계약형태 */}
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:flex-1 md:gap-2">
            <select
              value={routeFilter}
              onChange={(e) => onRouteChange(e.target.value)}
              disabled={!campFilter}
              title={!campFilter ? "캠프를 먼저 선택해야 합니다." : ""}
              className={`md:flex-1 px-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-all duration-200 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[center_right_0.75rem] pr-8 ${
                !campFilter
                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                  : routeFilter
                    ? "bg-blue-50 border-blue-300 text-blue-700 cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                    : "bg-white border-slate-200 text-slate-600 cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              }`}
            >
              <option value="">
                {!campFilter ? "라우트" : "라우트 (전체)"}
              </option>
              {availableRoutes.map((route) => (
                <option key={route} value={route}>
                  라우트 {route}
                </option>
              ))}
            </select>

            <select
              value={contractTypeFilter}
              onChange={(e) => onContractTypeChange(e.target.value)}
              className={`md:flex-1 px-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[center_right_0.75rem] pr-8 ${
                contractTypeFilter
                  ? "bg-blue-50 border-blue-300 text-blue-700 focus:ring-2 focus:ring-blue-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              }`}
            >
              <option value="">계약 형태 (전체)</option>
              <option value="고정">고정</option>
              <option value="용차">용차</option>
              <option value="백업">백업</option>
            </select>
          </div>
        </div>

        {/* PC 초기화 버튼 */}
        {hasFilters && (
          <button
            onClick={onReset}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl shrink-0 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
            초기화
          </button>
        )}
      </div>
    </div>
  );
};
