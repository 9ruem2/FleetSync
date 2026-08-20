import React from 'react';
import { useScheduleViewModel } from '../../viewmodels/useScheduleViewModel';
import { StatusBadge } from '../components/StatusBadge';
import { CellStatusModal } from './CellStatusModal';
import { BackupAssignModal } from '../backup/BackupAssignModal';
import { ToastNotification } from '../components/ToastNotification';
import { DriverSearchBar } from '../components/DriverSearchBar';
import { RouteBadges } from '../components/RouteBadges';
import { parseRoutes, parseCamps } from '../../utils/routeUtils';
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
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Header Bar & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>주간/월간 근무 스케줄표</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            기사별 근무 현황과 배정 형태를 매트릭스 형태로 한눈에 파악하고 편집할 수 있습니다. 셀 클릭 시 근무 상태 수정 및 대차 지정이 가능합니다.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Weekly / Monthly Toggle Buttons [F-02-01] */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => vm.setViewMode('weekly')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition ${vm.viewMode === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              주간
            </button>
            <button
              onClick={() => vm.setViewMode('monthly')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition ${vm.viewMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              월간
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

      {/* Date Navigation Bar & Legend */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            onClick={() => {
              const [y, m, dNum] = vm.selectedDate.split('-').map(Number);
              const d = new Date(y, m - 1, dNum);
              d.setDate(d.getDate() - (vm.viewMode === 'weekly' ? 7 : 30));
              const yearStr = d.getFullYear();
              const monthStr = String(d.getMonth() + 1).padStart(2, '0');
              const dayStr = String(d.getDate()).padStart(2, '0');
              vm.setSelectedDate(`${yearStr}-${monthStr}-${dayStr}`);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] sm:text-xs font-bold text-slate-800 whitespace-nowrap min-w-0 overflow-hidden">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            {vm.viewMode === 'weekly' && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white rounded-md font-sans text-[10px] sm:text-xs font-extrabold shadow-2xs shrink-0">
                {vm.weekOfYearInfo.weekNumber}주차
              </span>
            )}
            <span className="truncate">
              {vm.dateColumns[0]?.dateStr?.slice(5)} ~ {vm.dateColumns[vm.dateColumns.length - 1]?.dateStr?.slice(5)}
            </span>
          </div>

          <button
            onClick={() => {
              const [y, m, dNum] = vm.selectedDate.split('-').map(Number);
              const d = new Date(y, m - 1, dNum);
              d.setDate(d.getDate() + (vm.viewMode === 'weekly' ? 7 : 30));
              const yearStr = d.getFullYear();
              const monthStr = String(d.getMonth() + 1).padStart(2, '0');
              const dayStr = String(d.getDate()).padStart(2, '0');
              vm.setSelectedDate(`${yearStr}-${monthStr}-${dayStr}`);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs font-medium text-slate-600 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span className="font-bold text-slate-400 text-[11px] shrink-0">범례:</span>
          <StatusBadge status="고정" size="sm" />
          <StatusBadge status="용차" size="sm" />
          <StatusBadge status="백업" size="sm" />
          <StatusBadge status="휴무" size="sm" />
          <StatusBadge status="휴무" backupAssigned backupDriverName="대차" size="sm" />
        </div>
      </div>

      {/* Schedule Matrix Table [F-02-01] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {vm.loading ? (
          <div className="p-12 sm:p-16 text-center text-slate-400 text-sm font-medium">
            근무 스케줄표 데이터를 로딩 중입니다...
          </div>
        ) : vm.filteredGridRows.length === 0 ? (
          <div className="p-12 sm:p-16 text-center text-slate-400 text-sm font-medium">
            {vm.gridRows.length === 0
              ? '등록된 기사 정보가 없습니다. 먼저 기사를 등록해 주세요.'
              : '검색 조건에 맞는 기사가 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold divide-x divide-slate-800">
                  <th className="py-3 sm:py-4 px-3 sm:px-5 min-w-[150px] sm:min-w-[220px] sticky left-0 z-20 bg-slate-900 shadow-md">
                    기사명 / 담당 라우트
                  </th>

                  {/* X-Axis Headers: Dates */}
                  {vm.dateColumns.map(col => (
                    <th
                      key={col.dateStr}
                      className={`py-2.5 sm:py-3 px-2 sm:px-3 text-center min-w-[85px] sm:min-w-[100px] font-mono ${col.isWeekend ? 'bg-slate-800/80 text-amber-300' : ''
                        }`}
                    >
                      <div className="text-[10px] sm:text-[11px] opacity-75">{col.dayName}</div>
                      <div className="text-xs sm:text-sm font-extrabold mt-0.5">{col.dayNumber}일</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {vm.filteredGridRows.map(row => {
                  const routes = parseRoutes(row.routes);
                  const camps = parseCamps(row.camp);

                  return (
                    <tr key={row.driverId} className="hover:bg-slate-50/80 transition group">
                      <td className="py-2.5 sm:py-3 px-3 sm:px-5 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-1 sm:gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{row.driverName}</div>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {camps.map((c, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                                  {c}
                                </span>
                              ))}
                              <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                                ID: {row.driverCode || '-'}
                              </span>
                            </div>
                            <div className="mt-1.5 space-y-1">
                              {routes.length > 0 && (
                                <RouteBadges routes={routes} label="담당 라우트" size="sm" />
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
                            className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50/50 transition ${col.isWeekend ? 'bg-slate-50/50' : ''
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
                                  className="mt-0.5 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded flex items-center gap-0.5 transition shadow-2xs"
                                >
                                  <UserCheck className="w-2.5 h-2.5 shrink-0" />
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
