import React from 'react';
import { Driver } from '../../models/driver.model';
import { SlotAssignment } from '../../viewmodels/useScheduleViewModel';
import { Truck, Calendar, User, Phone, MapPin } from 'lucide-react';

interface Props {
  driver: Driver;
  targetMonth: string; // e.g. '2026-08'
  assignments: Record<string, SlotAssignment>; // key: "2026-08-01_남양주3/905CD"
}

export const DriverMonthlyScheduleCard: React.FC<Props> = ({
  driver,
  targetMonth,
  assignments,
}) => {
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 8;

  const totalDays = new Date(year, month, 0).getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜별 이 기사의 배차 상태 추출
  const dailySchedule: {
    dateStr: string;
    dayNum: number;
    dayName: string;
    isWeekend: boolean;
    status: string; // '고정' | '용차' | '백업' | '휴무' | '대차투입' | '미배정'
    routeDisplay: string;
    isBackupDriver: boolean;
    originalDriverName?: string;
  }[] = [];

  let workDays = 0;
  let offDays = 0;
  let backupWorkDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayPadded = String(d).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayPadded}`;
    const dateObj = new Date(year, month - 1, d);
    const dayIdx = dateObj.getDay();
    const isWeekend = dayIdx === 0 || dayIdx === 6;

    // 해당 날짜에 이 기사가 배정된 슬롯 찾기
    let matchedSlot: SlotAssignment | null = null;
    let matchedRouteKey = '';
    let isBackup = false;

    Object.entries(assignments).forEach(([key, slot]) => {
      if (key.startsWith(dateStr)) {
        if (slot.driverId === driver.id) {
          matchedSlot = slot;
          matchedRouteKey = key.slice(dateStr.length + 1);
        } else if (slot.backupDriverId === driver.id) {
          matchedSlot = slot;
          matchedRouteKey = key.slice(dateStr.length + 1);
          isBackup = true;
        }
      }
    });

    let status = '미배정';
    let routeDisplay = '-';
    let originalDriverName = undefined;

    if (matchedSlot) {
      const [cName, rName] = matchedRouteKey.split('/');
      const shortCamp = (cName || '').replace('남양주', '남').replace('구리', '구');
      routeDisplay = rName ? `${shortCamp}/${rName}` : matchedRouteKey;

      if (isBackup) {
        status = '대차투입';
        originalDriverName = (matchedSlot as any).driverName;
        backupWorkDays++;
        workDays++;
      } else if ((matchedSlot as any).status === '휴무') {
        status = '휴무';
        offDays++;
      } else {
        status = (matchedSlot as any).contractType || (matchedSlot as any).status || '고정';
        workDays++;
      }
    }

    dailySchedule.push({
      dateStr,
      dayNum: d,
      dayName: dayNames[dayIdx],
      isWeekend,
      status,
      routeDisplay,
      isBackupDriver: isBackup,
      originalDriverName,
    });
  }

  return (
    <div
      id={`driver-schedule-card-${driver.id}`}
      className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 max-w-2xl w-full mx-auto font-['Pretendard',sans-serif]"
    >
      {/* Header Banner - 불필요한 메타데이터 제거하고 기사명과 년/월만 심플하게 표시 */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {driver.name} 기사님
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-blue-600 font-mono">
            {year}년 {month}월
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-4 gap-2.5 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500">총 일수</div>
          <div className="text-base font-black text-slate-800 font-mono mt-0.5">{totalDays}일</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-blue-200 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-600">실 근무일</div>
          <div className="text-base font-black text-blue-700 font-mono mt-0.5">{workDays}일</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-red-200 shadow-2xs">
          <div className="text-[11px] font-bold text-red-600">휴무일</div>
          <div className="text-base font-black text-red-700 font-mono mt-0.5">{offDays}일</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600">대차 근무</div>
          <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{backupWorkDays}일</div>
        </div>
      </div>

      {/* Schedule Table (Calendar Matrix / 7-Day Grid) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5 shadow-2xs">
        <table className="w-full text-center border-collapse table-fixed text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-xs divide-x divide-slate-800">
              <th className="py-2.5 px-1 w-1/7 text-red-400">일</th>
              <th className="py-2.5 px-1 w-1/7">월</th>
              <th className="py-2.5 px-1 w-1/7">화</th>
              <th className="py-2.5 px-1 w-1/7">수</th>
              <th className="py-2.5 px-1 w-1/7">목</th>
              <th className="py-2.5 px-1 w-1/7">금</th>
              <th className="py-2.5 px-1 w-1/7 text-amber-300">토</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-slate-100/50">
            {(() => {
              const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
              const weeks: (typeof dailySchedule[0] | null)[][] = [];
              let currentWeek: (typeof dailySchedule[0] | null)[] = [];

              // Leading empty cells
              for (let i = 0; i < firstDayOfWeek; i++) {
                currentWeek.push(null);
              }

              // Days
              dailySchedule.forEach((day) => {
                currentWeek.push(day);
                if (currentWeek.length === 7) {
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
              });

              // Trailing empty cells
              if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                  currentWeek.push(null);
                }
                weeks.push(currentWeek);
              }

              return weeks.map((week, wIdx) => (
                <tr key={wIdx} className="divide-x divide-slate-200 bg-white">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return <td key={dIdx} className="p-2 bg-slate-50/60 min-h-[58px]"></td>;
                    }

                    const isSun = dIdx === 0;
                    const isSat = dIdx === 6;

                    let bgStyle = 'bg-white';
                    let statusBadge = null;

                    if (day.status === '휴무') {
                      bgStyle = 'bg-red-50/70 text-red-900';
                      statusBadge = (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-100/80 border border-red-200 px-1.5 py-0.5 rounded">
                          휴무
                        </span>
                      );
                    } else if (day.status === '대차투입') {
                      bgStyle = 'bg-emerald-50 text-emerald-950';
                      statusBadge = (
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-1.5 py-0.5 rounded truncate max-w-full block">
                          대차 {day.routeDisplay}
                        </span>
                      );
                    } else if (day.status !== '미배정') {
                      bgStyle = 'bg-blue-50/60 text-blue-950';
                      statusBadge = (
                        <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/80 border border-blue-200 px-1.5 py-0.5 rounded truncate max-w-full block">
                          {day.routeDisplay}
                        </span>
                      );
                    }

                    return (
                      <td key={dIdx} className={`p-1.5 sm:p-2 align-top h-[58px] sm:h-[64px] transition ${bgStyle}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isSun
                                ? 'text-red-600'
                                : isSat
                                ? 'text-blue-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {day.dayNum}
                          </span>
                        </div>
                        <div className="h-[26px] flex items-center justify-center">
                          {statusBadge}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span>FleetSync PRO 쿠팡 기사 배차 관리 시스템</span>
        <span className="font-mono">발행일: {new Date().toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
};
