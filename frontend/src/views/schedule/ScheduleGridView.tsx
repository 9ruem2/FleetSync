import React from 'react';
import { useScheduleViewModel } from '../../viewmodels/useScheduleViewModel';
import { StatusBadge } from '../components/StatusBadge';
import { CellStatusModal } from './CellStatusModal';
import { BackupAssignModal } from '../backup/BackupAssignModal';
import { ToastNotification } from '../components/ToastNotification';
import { DriverSearchBar } from '../components/DriverSearchBar';
import { RouteBadges } from '../components/RouteBadges';
import { getActiveRoutesForDate, parseRoutes } from '../../utils/routeUtils';
import type { WeekPattern } from '../../models/driver.model';
import {
  CalendarRange,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export const ScheduleGridView: React.FC = () => {
  const vm = useScheduleViewModel();

  return (
    <div className="p-8 space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Header Bar & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-600" />
            <span>주간/월간 근무 스케줄표 (Grid View)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            기사별 근무 현황과 배정 형태를 매트릭스 형태로 한눈에 파악하고 편집할 수 있습니다. 셀 클릭 시 근무 상태 수정 및 대차 지정이 가능합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Weekly / Monthly Toggle Buttons [F-02-01] */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => vm.setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                vm.viewMode === 'weekly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              주간 (7일)
            </button>
            <button
              onClick={() => vm.setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                vm.viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월간 (전체)
            </button>
          </div>

          <button
            onClick={vm.reload}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <DriverSearchBar
        searchTerm={vm.searchTerm}
        onSearchChange={vm.setSearchTerm}
        contractTypeFilter={vm.contractTypeFilter}
        onContractTypeChange={vm.setContractTypeFilter}
        routeFilter={vm.routeFilter}
        onRouteChange={vm.setRouteFilter}
        availableRoutes={vm.availableRoutes}
        onReset={vm.resetFilters}
      />

      {/* Date Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(vm.selectedDate);
              d.setDate(d.getDate() - (vm.viewMode === 'weekly' ? 7 : 30));
              vm.setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {vm.dateColumns[0]?.dateStr} ~ {vm.dateColumns[vm.dateColumns.length - 1]?.dateStr}
            </span>
          </div>

          <button
            onClick={() => {
              const d = new Date(vm.selectedDate);
              d.setDate(d.getDate() + (vm.viewMode === 'weekly' ? 7 : 30));
              vm.setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="font-bold text-slate-400">범례:</span>
          <StatusBadge status="고정" size="sm" />
          <StatusBadge status="용차" size="sm" />
          <StatusBadge status="백업" size="sm" />
          <StatusBadge status="휴무" size="sm" />
          <StatusBadge status="휴무" backupAssigned backupDriverName="대차" size="sm" />
        </div>
      </div>

      {/* Schedule Matrix Table [F-02-01] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {vm.loading ? (
          <div className="p-16 text-center text-slate-400 text-sm font-medium">
            근무 스케줄표 데이터를 로딩 중입니다...
          </div>
        ) : vm.filteredGridRows.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm font-medium">
            {vm.gridRows.length === 0
              ? '등록된 기사 정보가 없습니다. 먼저 기사를 등록해 주세요.'
              : '검색 조건에 맞는 기사가 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold divide-x divide-slate-800">
                  <th className="py-4 px-5 min-w-[240px] sticky left-0 z-20 bg-slate-900 shadow-md">
                    기사명 / 담당 라우트
                  </th>

                  {/* X-Axis Headers: Dates */}
                  {vm.dateColumns.map(col => (
                    <th
                      key={col.dateStr}
                      className={`py-3 px-3 text-center min-w-[100px] font-mono ${
                        col.isWeekend ? 'bg-slate-800/80 text-amber-300' : ''
                      }`}
                    >
                      <div className="text-[11px] opacity-75">{col.dayName}</div>
                      <div className="text-sm font-extrabold mt-0.5">{col.dayNumber}일</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {vm.filteredGridRows.map(row => {
                  const viewStartDate = vm.dateColumns[0]?.dateStr ?? vm.selectedDate;
                  const activeRoutes = getActiveRoutesForDate(
                    {
                      routesWeek13: row.routesWeek13,
                      routesWeek24: row.routesWeek24,
                      weekPattern: row.weekPattern as WeekPattern,
                      routeNumber: row.routeNumber,
                    },
                    viewStartDate
                  );

                  return (
                  <tr key={row.driverId} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-5 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm">{row.driverName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            ID: {row.driverCode || '-'}
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {activeRoutes.length > 0 ? (
                              <RouteBadges routes={activeRoutes} label="이번 주차" size="sm" />
                            ) : (
                              <>
                                {(row.weekPattern === '1,3' || row.weekPattern === 'both') && (
                                  <RouteBadges routes={parseRoutes(row.routesWeek13)} label="1,3주" size="sm" />
                                )}
                                {(row.weekPattern === '2,4' || row.weekPattern === 'both') && (
                                  <RouteBadges routes={parseRoutes(row.routesWeek24)} label="2,4주" size="sm" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={row.contractType as any} size="sm" />
                      </div>
                    </td>

                    {/* Matrix Cells: Date shifts [F-02-01, F-02-02] */}
                    {vm.dateColumns.map(col => {
                      const shift = row.shifts[col.dateStr] || { status: row.contractType as any };
                      return (
                        <td
                          key={col.dateStr}
                          onClick={() =>
                            vm.setActiveCell({
                              driverId: row.driverId,
                              driverName: row.driverName,
                              routeNumber: vm.getPrimaryRouteForRow(row, col.dateStr),
                              date: col.dateStr,
                              currentStatus: shift.status,
                              backupAssigned: shift.backupAssigned,
                              backupDriverName: shift.backupDriverName
                            })
                          }
                          className={`py-3 px-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50/50 transition ${
                            col.isWeekend ? 'bg-slate-50/50' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <StatusBadge
                              status={shift.status}
                              backupAssigned={shift.backupAssigned}
                              backupDriverName={shift.backupDriverName}
                              size="sm"
                            />

                            {/* Shortcut for quick backup match button if off-day */}
                            {shift.status === '휴무' && !shift.backupAssigned && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  vm.openBackupAssign(
                                    row.driverId,
                                    row.driverName,
                                    vm.getPrimaryRouteForRow(row, col.dateStr),
                                    col.dateStr
                                  );
                                }}
                                className="mt-1 text-[10px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded flex items-center gap-1 transition shadow-xs"
                              >
                                <UserCheck className="w-2.5 h-2.5" />
                                <span>대차지정</span>
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cell Status Edit Modal [F-02-02] */}
      <CellStatusModal
        isOpen={vm.activeCell !== null}
        cell={vm.activeCell}
        onClose={() => vm.setActiveCell(null)}
        onSelectStatus={status => {
          if (vm.activeCell) {
            vm.handleUpdateCellStatus(vm.activeCell.driverId, vm.activeCell.date, status);
          }
        }}
        onOpenBackup={() => {
          if (vm.activeCell) {
            vm.openBackupAssign(
              vm.activeCell.driverId,
              vm.activeCell.driverName,
              vm.activeCell.routeNumber,
              vm.activeCell.date
            );
          }
        }}
      />

      {/* Manual Backup Assign Modal [F-02-06] */}
      <BackupAssignModal
        target={vm.backupTarget}
        onClose={() => vm.setBackupTarget(null)}
        onSuccess={vm.reload}
      />
    </div>
  );
};
