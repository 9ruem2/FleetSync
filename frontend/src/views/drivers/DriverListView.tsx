import React from 'react';
import { useDriverViewModel } from '../../viewmodels/useDriverViewModel';
import { formatPhoneNumber } from '../../utils/phoneFormat';
import { StatusBadge } from '../components/StatusBadge';
import { DriverFormModal } from './DriverFormModal';
import { DriverDeleteModal } from './DriverDeleteModal';
import { ToastNotification } from '../components/ToastNotification';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  RefreshCw,
  Users
} from 'lucide-react';

export const DriverListView: React.FC = () => {
  const vm = useDriverViewModel();

  return (
    <div className="p-8 space-y-6">
      {/* Toast notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>기사 목록 및 라우트 통합 관리</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            전체 등록 기사의 기본 정보, 연락처, 담당 라우트 및 계약 형태를 등록·수정·조회·삭제(CRUD)합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={vm.reload}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => vm.setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>신규 기사 등록</span>
          </button>
        </div>
      </div>

      {/* Filters Bar [F-01-01] */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="기사명, 연락처, 라우트 검색..."
            value={vm.searchTerm}
            onChange={e => vm.setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">필터:</span>
          </div>

          {/* Contract Type Filter */}
          <select
            value={vm.contractTypeFilter}
            onChange={e => vm.setContractTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          >
            <option value="">계약 형태 (전체)</option>
            <option value="고정">고정</option>
            <option value="용차">용차</option>
            <option value="백업">백업</option>
          </select>

          {/* Route Number Filter */}
          <select
            value={vm.routeFilter}
            onChange={e => vm.setRouteFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          >
            <option value="">라우트 (전체)</option>
            {vm.availableRoutes.map(route => (
              <option key={route} value={route}>
                라우트 {route}
              </option>
            ))}
          </select>

          {(vm.searchTerm || vm.contractTypeFilter || vm.routeFilter) && (
            <button
              onClick={() => {
                vm.setSearchTerm('');
                vm.setContractTypeFilter('');
                vm.setRouteFilter('');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline px-2"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Driver List Table [F-01-01] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {vm.loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            기사 목록을 불러오는 중입니다...
          </div>
        ) : vm.filteredDrivers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            조건에 상응하는 기사 정보가 존재하지 않습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">기사명</th>
                  <th className="py-3.5 px-6">담당 라우트</th>
                  <th className="py-3.5 px-6">연락처</th>
                  <th className="py-3.5 px-6">계약 형태</th>
                  <th className="py-3.5 px-6">등록 일시</th>
                  <th className="py-3.5 px-6 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vm.filteredDrivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-slate-50/80 transition">
                    {/* Driver Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {driver.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{driver.name}</span>
                          <span className="block text-[11px] text-slate-400">ID: {driver.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Route Number */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{driver.routeNumber}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 text-slate-700">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatPhoneNumber(driver.phone)}</span>
                      </div>
                    </td>

                    {/* Contract Type */}
                    <td className="py-4 px-6">
                      <StatusBadge status={driver.contractType} />
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-slate-400 text-[11px] font-mono">
                      {new Date(driver.createdAt).toLocaleDateString('ko-KR')}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => vm.setEditingDriver(driver)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>수정</span>
                      </button>

                      <button
                        onClick={() => vm.setDeletingDriver(driver)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
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
