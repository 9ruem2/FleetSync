import React from 'react';
import { useCalendarViewModel } from '../../viewmodels/useCalendarViewModel';
import { QuickVacationModal } from './QuickVacationModal';
import { BackupAssignModal } from '../backup/BackupAssignModal';
import { ToastNotification } from '../components/ToastNotification';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  UserCheck,
  Calendar as CalendarIcon,
  Users
} from 'lucide-react';

export const VacationCalendarView: React.FC = () => {
  const vm = useCalendarViewModel();

  const monthTitle = vm.currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  });

  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="p-8 space-y-6">
      {/* Toast notification */}
      <ToastNotification toast={vm.toastMessage} />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>휴무 달력 현황판 (Calendar View) [F-02-04]</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            월간/주간 단위로 일자별 휴무자 현황과 노선을 모아보고, 날짜를 클릭하여 빠르게 휴무를 등록 및 대차 지정할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={vm.setTodayMonth}
            className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
          >
            이번 달 (2026년 8월)
          </button>

          <button
            onClick={vm.reload}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Control Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={vm.prevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 font-extrabold text-base text-slate-900 font-mono px-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>{monthTitle}</span>
          </div>

          <button
            onClick={vm.nextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>달력 날짜 셀을 클릭하면 휴무를 등록할 수 있습니다.</span>
        </div>
      </div>

      {/* FullCalendar Matrix Grid [F-02-04] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {vm.loading ? (
          <div className="p-16 text-center text-slate-400 text-sm font-medium">
            휴무 달력 데이터를 로딩 중입니다...
          </div>
        ) : (
          <div>
            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 bg-slate-900 text-white text-xs font-bold text-center border-b border-slate-800">
              {weekDayNames.map((day, idx) => (
                <div
                  key={day}
                  className={`py-3.5 ${
                    idx === 0 ? 'text-red-400' : idx === 6 ? 'text-amber-300' : ''
                  }`}
                >
                  {day}요일
                </div>
              ))}
            </div>

            {/* Calendar Cells Matrix */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200">
              {vm.calendarGrid.map((cell, idx) => {
                const isSunday = idx % 7 === 0;
                const isSaturday = idx % 7 === 6;
                const totalOffCount = cell.offDayRecords.length;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => vm.setQuickVacationDate(cell.dateStr)}
                    className={`min-h-[120px] p-2.5 bg-white transition hover:bg-slate-50/90 cursor-pointer flex flex-col justify-between group ${
                      !cell.isCurrentMonth ? 'opacity-40 bg-slate-50' : ''
                    } ${cell.isToday ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
                  >
                    {/* Top Row: Date number & Total summary badge [F-02-04] */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                          cell.isToday
                            ? 'bg-blue-600 text-white'
                            : isSunday
                            ? 'text-red-600 font-extrabold'
                            : isSaturday
                            ? 'text-blue-600 font-extrabold'
                            : 'text-slate-800'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Summary Off-day Count Badge [F-02-04] */}
                      {totalOffCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shadow-2xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>휴무 {totalOffCount}명</span>
                        </span>
                      )}
                    </div>

                    {/* Off-day Drivers List Cards */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-24 pr-0.5">
                      {cell.offDayRecords.map(record => (
                        <div
                          key={record.id}
                          onClick={e => {
                            e.stopPropagation();
                            vm.setBackupTarget({
                              date: record.date,
                              routeNumber: record.routeNumber,
                              originalDriverId: record.driverId,
                              originalDriverName: record.driverName
                            });
                          }}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium transition flex items-center justify-between ${
                            record.backupAssigned
                              ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                              : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100'
                          }`}
                          title={
                            record.backupAssigned
                              ? `대차: ${record.backupDriverName}`
                              : '클릭하여 대차 기사 지정'
                          }
                        >
                          <div>
                            <span className="font-bold">{record.driverName}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              [{record.routeNumber}]
                            </span>
                          </div>

                          {record.backupAssigned ? (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              대차: {record.backupDriverName}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-red-200 hover:bg-red-300 text-red-900 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <UserCheck className="w-2.5 h-2.5" />
                              대차지정
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Quick Add Prompt */}
                    <div className="mt-1 opacity-0 group-hover:opacity-100 transition text-[10px] text-blue-600 font-bold flex items-center justify-center gap-1 pt-1 border-t border-slate-100">
                      <Plus className="w-3 h-3" />
                      <span>휴무 추가</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Vacation Register Modal [F-02-05] */}
      <QuickVacationModal
        isOpen={vm.quickVacationDate !== null}
        date={vm.quickVacationDate}
        drivers={vm.allDrivers}
        onClose={() => vm.setQuickVacationDate(null)}
        onSubmit={vm.handleRegisterOffDay}
      />

      {/* Backup Assign Modal [F-02-06] */}
      <BackupAssignModal
        target={vm.backupTarget}
        onClose={() => vm.setBackupTarget(null)}
        onSuccess={vm.reload}
      />
    </div>
  );
};
