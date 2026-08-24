import { useState, useEffect, useCallback, useMemo } from 'react';
import { OffDayRecord } from '../models/schedule.model';
import { Driver } from '../models/driver.model';
import { ApiService } from '../services/apiService';
import { isDateMatchingFixedHoliday } from '../utils/fixedHolidayUtils';
import { getShortCampName } from '../utils/routeUtils';

export function useCalendarViewModel() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [offDays, setOffDays] = useState<OffDayRecord[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick vacation add modal target date
  const [quickVacationDate, setQuickVacationDate] = useState<string | null>(null);

  // Backup assignment modal target
  const [backupTarget, setBackupTarget] = useState<{
    date: string;
    routeNumber: string;
    originalDriverId: number;
    originalDriverName: string;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch off-days and drivers + slotAssignments + fixed holidays
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 달력 범위 (현재 월 기준 이전달 ~ 다음달)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month - 1, 20).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 15).toISOString().split('T')[0];

      let campsParam: string | undefined = undefined;
      let allowedCamps: string[] = [];
      try {
        const saved = localStorage.getItem("fleetsync_session");
        if (saved) {
          const s = JSON.parse(saved);
          if (s?.permissions?.isAllCampsAccessible === false && s?.permissions?.assignedCampNames?.length > 0) {
            allowedCamps = s.permissions.assignedCampNames.map((c: string) => c.toLowerCase().trim());
            campsParam = s.permissions.assignedCampNames.join(",");
          }
        }
      } catch {}

      const [offDaysData, rawDriversData, backupAssignments] = await Promise.all([
        ApiService.getOffDays(startDate, endDate).catch(() => []),
        ApiService.getDrivers(undefined, undefined, undefined, campsParam).catch(() => []),
        ApiService.getBackupAssignments().catch(() => []),
      ]);

      let driversData = rawDriversData;
      if (allowedCamps.length > 0) {
        driversData = rawDriversData.filter(d => {
          const cList = (d.camp || "").split(",").map(c => c.trim().toLowerCase()).filter(Boolean);
          return cList.some(c => allowedCamps.includes(c));
        });
      }

      const backupMap = new Map<string, any>();
      backupAssignments.forEach((b: any) => {
        backupMap.set(`${b.date}_${b.originalDriverId}`, b);
      });

      // 1. 노선 관리에서 저장된 슬롯 배정 데이터 확인
      let slotAssignments: Record<string, any> = {};
      try {
        const saved = localStorage.getItem('fleetsync_slot_assignments');
        if (saved) slotAssignments = JSON.parse(saved);
      } catch {
        slotAssignments = {};
      }

      // 2. 슬롯 배정 중 휴무(status === '휴무')인 항목 추출
      const slotOffDays: OffDayRecord[] = [];
      Object.entries(slotAssignments).forEach(([key, val]: [string, any]) => {
        if (val.status === '휴무') {
          // key 형식: "2026-08-21_남양주3/905CD"
          const splitIdx = key.indexOf('_');
          if (splitIdx !== -1) {
            const date = key.slice(0, splitIdx);
            const routeKey = key.slice(splitIdx + 1); // "남양주3/905CD"
            const [cName, rName] = routeKey.split('/');

            // 담당 캠프 권한 필터
            if (allowedCamps.length > 0) {
              const campLower = (cName || '').toLowerCase().trim();
              if (!allowedCamps.includes(campLower)) return;
            }

            const shortCamp = getShortCampName(cName);
            const displayRoute = rName ? `${shortCamp}/${rName}` : cName;

            slotOffDays.push({
              id: val.driverId * 10000 + Math.abs(key.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 1000),
              driverId: val.driverId,
              driverName: val.driverName,
              routeNumber: rName || routeKey,
              campName: cName,
              routeName: rName,
              displayRoute,
              date,
              backupAssigned: !!val.backupDriverId,
              backupDriverName: val.backupDriverName,
            });
          }
        }
      });

      // 3. 기사별 고정 휴무일(fixedHolidays) 자동 계산하여 병합 (관리자 담당 캠프 기준)
      const mergedMap = new Map<string, OffDayRecord>();

      // 달력에 표시될 전체 날짜 리스트 생성 (전후 45일)
      const dateList: string[] = [];
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dateList.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }

      // 기사별 고정 휴무일 주입 (관리자의 담당 캠프에 해당하는 소속 정보로 정확히 배정)
      driversData.forEach((driver) => {
        if (driver.fixedHolidays && driver.fixedHolidays.length > 0) {
          // 기사가 소속된 모든 캠프 및 라우트 목록 추출
          const driverCamps: { campName: string; routeName: string }[] = [];
          if (driver.campRoutes && driver.campRoutes.length > 0) {
            driver.campRoutes.forEach((cr) => {
              if (cr.campName) driverCamps.push({ campName: cr.campName, routeName: cr.route || "" });
            });
          } else {
            const cList = (driver.camp || "").split(",").map((s) => s.trim()).filter(Boolean);
            const rList = (driver.routes || "").split(",").map((s) => s.trim());
            cList.forEach((c, i) => {
              driverCamps.push({ campName: c, routeName: rList[i] || "" });
            });
          }

          // 현재 로그인된 관리자가 볼 수 있는 이 기사의 캠프들만 선별
          const targetCampsForManager =
            allowedCamps.length > 0
              ? driverCamps.filter((dc) => allowedCamps.includes(dc.campName.toLowerCase().trim()))
              : driverCamps;

          if (targetCampsForManager.length === 0) return;

          dateList.forEach((dStr) => {
            const isFixed = driver.fixedHolidays!.some((h) =>
              isDateMatchingFixedHoliday(dStr, h.weekCycle, h.dayOfWeek)
            );

            if (isFixed) {
              // 해당 요일/주차에 매칭되는 정기 패턴이 있으면 그 캠프를 우선, 없으면 1순위 담당 캠프 선택
              let chosenCamp = targetCampsForManager[0];
              if (driver.routePatterns && driver.routePatterns.length > 0) {
                const matchedPattern = driver.routePatterns.find((p) =>
                  isDateMatchingFixedHoliday(dStr, p.weekCycle, p.dayOfWeek)
                );
                if (matchedPattern && matchedPattern.campName) {
                  const found = targetCampsForManager.find(
                    (tc) => tc.campName.toLowerCase().trim() === matchedPattern.campName.toLowerCase().trim()
                  );
                  if (found) {
                    chosenCamp = {
                      campName: matchedPattern.campName,
                      routeName: matchedPattern.routeName || found.routeName,
                    };
                  }
                }
              }

              const shortCamp = getShortCampName(chosenCamp.campName);
              const displayRoute = chosenCamp.routeName
                ? shortCamp
                  ? `${shortCamp}/${chosenCamp.routeName}`
                  : chosenCamp.routeName
                : shortCamp;

              const backup = backupMap.get(`${dStr}_${driver.id}`);
              mergedMap.set(`${dStr}_${driver.id}`, {
                id:
                  driver.id * 10000 +
                  Math.abs(
                    `${dStr}_${chosenCamp.campName}`.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) %
                      1000
                  ),
                driverId: driver.id,
                driverName: driver.name,
                campName: chosenCamp.campName,
                routeName: chosenCamp.routeName,
                displayRoute,
                routeNumber: chosenCamp.routeName || "-",
                date: dStr,
                backupAssigned: !!backup,
                backupDriverName: backup?.backupDriverName,
              });
            }
          });
        }
      });

      // 4. DB 오프데이 데이터 병합 (수동 지정 오프데이 - 담당 캠프만)
      offDaysData.forEach((r) => {
        const dObj = driversData.find((d) => d.id === r.driverId);
        if (!dObj) return;

        const dCamps: { campName: string; routeName: string }[] = [];
        if (dObj.campRoutes && dObj.campRoutes.length > 0) {
          dObj.campRoutes.forEach((cr) => {
            if (cr.campName) dCamps.push({ campName: cr.campName, routeName: cr.route || "" });
          });
        } else {
          const cList = (dObj.camp || "").split(",").map((s) => s.trim()).filter(Boolean);
          const rList = (dObj.routes || "").split(",").map((s) => s.trim());
          cList.forEach((c, i) => dCamps.push({ campName: c, routeName: rList[i] || "" }));
        }

        const validCamps =
          allowedCamps.length > 0
            ? dCamps.filter((dc) => allowedCamps.includes(dc.campName.toLowerCase().trim()))
            : dCamps;

        if (validCamps.length === 0) return;

        const matchedCamp =
          validCamps.find((vc) => r.campName && vc.campName.toLowerCase() === r.campName.toLowerCase()) ||
          validCamps[0];

        const shortCamp = getShortCampName(matchedCamp.campName);
        const displayRoute = matchedCamp.routeName
          ? shortCamp
            ? `${shortCamp}/${matchedCamp.routeName}`
            : matchedCamp.routeName
          : shortCamp;

        mergedMap.set(`${r.date}_${r.driverId}`, {
          ...r,
          campName: matchedCamp.campName,
          routeName: matchedCamp.routeName,
          displayRoute,
        });
      });

      // 5. 슬롯 배정 우선 적용 오버라이드
      slotOffDays.forEach((r) => {
        mergedMap.set(`${r.date}_${r.driverId}`, r);
      });

      // 6. 최종 담당 캠프 항목만 엄격하게 필터링하여 상태 설정
      const filteredOffDays = Array.from(mergedMap.values()).filter((r) => {
        if (allowedCamps.length === 0) return true;
        const cLower = (r.campName || "").toLowerCase().trim();
        return allowedCamps.includes(cLower);
      });

      setOffDays(filteredOffDays);
      setAllDrivers(driversData);
    } catch (err: any) {
      setError(err.message || '휴무 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group off-days by date string "YYYY-MM-DD"
  const offDaysByDate = useMemo(() => {
    const map = new Map<string, OffDayRecord[]>();
    offDays.forEach(record => {
      const existing = map.get(record.date) || [];
      // Ensure no duplicate driver on the same date
      if (!existing.some(e => e.driverId === record.driverId)) {
        existing.push(record);
      }
      map.set(record.date, existing);
    });
    return map;
  }, [offDays]);

  // Calendar Days Matrix Generation (Standard 6-week 42-cell monthly calendar grid)
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      offDayRecords: OffDayRecord[];
    }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const monthStr = prevMonth + 1 < 10 ? `0${prevMonth + 1}` : `${prevMonth + 1}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${prevYear}-${monthStr}-${dayStr}`;

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        offDayRecords: offDaysByDate.get(dateStr) || []
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        offDayRecords: offDaysByDate.get(dateStr) || []
      });
    }

    // Next month padding to reach 35 or 42 cells
    const remainingCells = (cells.length > 35 ? 42 : 35) - cells.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const monthStr = nextMonth + 1 < 10 ? `0${nextMonth + 1}` : `${nextMonth + 1}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${nextYear}-${monthStr}-${dayStr}`;

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        offDayRecords: offDaysByDate.get(dateStr) || []
      });
    }

    return cells;
  }, [currentDate, offDaysByDate]);

  // Command: Register Off-day for driver on quickVacationDate
  const handleRegisterOffDay = async (driverId: number, date: string) => {
    try {
      await ApiService.updateShiftCell(driverId, date, '휴무');
      showToast('success', '휴무가 지정되었습니다.');
      setQuickVacationDate(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || '휴무 등록 실패');
    }
  };

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const setTodayMonth = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    calendarGrid,
    allDrivers,
    loading,
    error,
    quickVacationDate,
    setQuickVacationDate,
    backupTarget,
    setBackupTarget,
    toastMessage,
    prevMonth,
    nextMonth,
    setTodayMonth,
    handleRegisterOffDay,
    reload: loadData
  };
}
