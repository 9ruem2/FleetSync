import React from 'react';
import { useDriverViewModel } from '../../viewmodels/useDriverViewModel';
import { formatPhoneNumber } from '../../utils/phoneFormat';
import { StatusBadge } from '../components/StatusBadge';
import { RouteBadges } from '../components/RouteBadges';
import { parseRoutes, parseCamps } from '../../utils/routeUtils';
import { DriverFormModal } from './DriverFormModal';
import { DriverDeleteModal } from './DriverDeleteModal';
import { ToastNotification } from '../components/ToastNotification';
import { DriverSearchBar } from '../components/DriverSearchBar';
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  RefreshCw,
  Users,
  Building2,
  MapPin
} from 'lucide-react';

export const DriverListView: React.FC = () => {
  const vm = useDriverViewModel();

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Toast notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>기사 목록 조회</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            전체 등록 기사의 기본 정보, 연락처, 계약 형태를 등록·수정·조회·삭제합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
          <button
            onClick={vm.reload}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => vm.setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>신규 기사 등록</span>
          </button>
        </div>
      </div>

      {/* Filters Bar [F-01-01] */}
      <DriverSearchBar
        searchTerm={vm.searchTerm}
        onSearchChange={vm.setSearchTerm}
        campFilter={vm.campFilter}
        onCampChange={vm.setCampFilter}
        availableCamps={vm.availableCamps}
        contractTypeFilter={vm.contractTypeFilter}
        onContractTypeChange={vm.setContractTypeFilter}
        routeFilter={vm.routeFilter}
        onRouteChange={vm.setRouteFilter}
        availableRoutes={vm.availableRoutes}
        onReset={vm.resetFilters}
      />

      {/* Driver List Table [F-01-01] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {vm.loading ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-sm font-medium">
            기사 목록을 불러오는 중입니다...
          </div>
        ) : vm.filteredDrivers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-sm font-medium">
            조건에 상응하는 기사 정보가 존재하지 않습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">기사명 / 사용 ID</th>
                  <th className="py-3.5 px-4 sm:px-6">담당 캠프 / 라우트</th>
                  <th className="py-3.5 px-4 sm:px-6">연락처</th>
                  <th className="py-3.5 px-4 sm:px-6">계약 형태</th>
                  <th className="py-3.5 px-4 sm:px-6">등록 일시</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vm.filteredDrivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-slate-50/80 transition">
                    {/* Driver Name */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {driver.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{driver.name}</span>
                          <span className="block text-[11px] text-slate-500 font-mono">
                            ID: {driver.driverCode || '-'}
                          </span>
                          <span className="block text-[10px] text-slate-400">키 #{driver.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Camp + Route (통합 인라인 표시) */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const camps = (driver.camp || '').split(',').map(s => s.trim()).filter(Boolean);
                          const routes = (driver.routes || '').split(',').map(s => s.trim());
                          if (camps.length === 0) return <span className="text-slate-400 text-xs">-</span>;
                          return camps.map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-sm">
                              <Building2 className="w-3 h-3 opacity-70" />
                              {c}
                              {routes[i] && (
                                <>
                                  <span className="opacity-40 mx-0.5">·</span>
                                  <MapPin className="w-3 h-3 opacity-70" />
                                  {routes[i]}
                                </>
                              )}
                            </span>
                          ));
                        })()}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatPhoneNumber(driver.phone)}</span>
                      </div>
                    </td>

                    {/* Contract Type */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <StatusBadge status={driver.contractType} />
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-[11px] font-mono">
                      {new Date(driver.createdAt).toLocaleDateString('ko-KR')}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => vm.setEditingDriver(driver)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-[11px]"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>수정</span>
                        </button>

                        <button
                          onClick={() => vm.setDeletingDriver(driver)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver Form Modal (Add / Edit) */}
      <DriverFormModal
        isOpen={vm.isAddModalOpen || vm.editingDriver !== null}
        driver={vm.editingDriver}
        onClose={() => {
          vm.setIsAddModalOpen(false);
          vm.setEditingDriver(null);
        }}
        onSubmit={form => {
          if (vm.editingDriver) {
            vm.handleUpdateDriver(vm.editingDriver.id, form);
          } else {
            vm.handleCreateDriver(form);
          }
        }}
      />

      {/* Driver Delete Confirmation Modal */}
      <DriverDeleteModal
        isOpen={vm.deletingDriver !== null}
        driver={vm.deletingDriver}
        onClose={() => vm.setDeletingDriver(null)}
        onConfirm={() => {
          if (vm.deletingDriver) {
            vm.handleDeleteDriver(vm.deletingDriver.id);
          }
        }}
      />
    </div>
  );
};
