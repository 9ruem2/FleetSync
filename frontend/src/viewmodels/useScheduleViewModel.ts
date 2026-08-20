import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShiftStatus } from '../models/schedule.model';
import { Driver } from '../models/driver.model';
import { ApiService } from '../services/apiService';
import { matchesDriverSearch } from '../utils/searchFilter';
import { parseRoutes, parseCamps } from '../utils/routeUtils';

export type ScheduleViewMode = 'weekly' | 'monthly';

export interface RouteColumn {
  key: string; // 예: "남양주3/905CD"
  campName: string;
  routeName: string;
  displayName: string; // 예: "남3/905CD"
}

export interface DateRowInfo {
  dateStr: string; // "2026-09-01"
  dayName: string; // "월"
  dayNumber: number; // 1
  isWeekend: boolean;
  formattedDate: string; // "9/1 (월)"
  weekLabel?: string; // 예: "1주차", "2주차"
}

export interface SlotAssignment {
  driverId: number;
  driverName: string;
  contractType: string;
  status: ShiftStatus;
  backupAssigned?: boolean;
  backupDriverId?: number;
  backupDriverName?: string;
  backupContractType?: string;
}

export function useScheduleViewModel() {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('weekly');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [masterCamps, setMasterCamps] = useState<{ id: number; name: string }[]>([]);
  const [masterRoutes, setMasterRoutes] = useState<{ id: number; campId: number; name: string }[]>([]);
  const [shiftsMap, setShiftsMap] = useState<Record<string, Record<number, ShiftStatus>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [campFilter, setCampFilter] = useState<string>('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // 셀 선택 시 배정/수정 모달용 상태
  const [selectedSlot, setSelectedSlot] = useState<{
    dateStr: string;
    routeKey: string;
    campName: string;
    routeName: string;
    currentAssignment?: SlotAssignment;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 주차 계산
  const weekOfYearInfo = useMemo(() => {
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const base = new Date(y, m - 1, dNum);
    const currentDay = base.getDay();
    const sunday = new Date(y, m - 1, dNum - currentDay);
    const thursday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 4);
    const year = thursday.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jan1Sunday = new Date(year, 0, 1 - jan1.getDay());
    const diffMs = sunday.getTime() - jan1Sunday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return { year, weekNumber };
  }, [selectedDate]);

  // 날짜 행 (Y축)
  const dateRows = useMemo<DateRowInfo[]>(() => {
    const dates: DateRowInfo[] = [];
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const base = new Date(y, m - 1, dNum);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 해당 날짜가 속한 연도 기준 N주차(1년 중 몇 주차인지) 계산 헬퍼 함수
    const getWeekOfYear = (d: Date): number => {
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const jan1 = new Date(target.getFullYear(), 0, 1);
      const jan1Day = jan1.getDay();
      const diffMs = target.getTime() - jan1.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.floor((diffDays + jan1Day) / 7) + 1;
    };

    if (viewMode === 'weekly') {
      const currentDay = base.getDay();
      const sunday = new Date(y, m - 1, dNum - currentDay);

      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
        const yearStr = d.getFullYear();
        const monthNum = d.getMonth() + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        const dayVal = d.getDate();
        const dayStr = String(dayVal).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        const dayIdx = d.getDay();
        const weekNum = getWeekOfYear(d);

        dates.push({
          dateStr,
          dayName: dayNames[dayIdx],
          dayNumber: dayVal,
          isWeekend: dayIdx === 0 || dayIdx === 6,
          formattedDate: `${monthNum}/${dayVal} (${dayNames[dayIdx]})`,
          weekLabel: dayIdx === 0 ? `${weekNum}주차` : undefined,
        });
      }
    } else {
      const year = base.getFullYear();
      const month = base.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        const monthNum = month + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const dayIdx = d.getDay();
        const weekNum = getWeekOfYear(d);

        dates.push({
          dateStr,
          dayName: dayNames[dayIdx],
          dayNumber: day,
          isWeekend: dayIdx === 0 || dayIdx === 6,
          formattedDate: `${monthNum}/${day} (${dayNames[dayIdx]})`,
          weekLabel: dayIdx === 0 ? `${weekNum}주차` : undefined,
        });
      }
    }
    return dates;
  }, [viewMode, selectedDate]);

  const startDate = dateRows[0]?.dateStr || '2026-08-01';
  const endDate = dateRows[dateRows.length - 1]?.dateStr || '2026-08-31';

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [driverList, gridData, campsData, routesData] = await Promise.all([
        ApiService.getDrivers().catch(() => []),
        ApiService.getScheduleGrid(startDate, endDate).catch(() => []),
        ApiService.getCamps().catch(() => []),
        ApiService.getRoutes().catch(() => []),
      ]);

      setDrivers(driverList);
      setMasterCamps(campsData);
      setMasterRoutes(routesData);

      // shiftsMap 구성
      const sMap: Record<string, Record<number, ShiftStatus>> = {};
      gridData.forEach(row => {
        Object.entries(row.shifts || {}).forEach(([date, shift]) => {
          if (!sMap[date]) sMap[date] = {};
          sMap[date][row.driverId] = shift.status;
        });
      });
      setShiftsMap(sMap);
    } catch (err: any) {
      console.error('[loadData error]:', err);
      setError(err.message || '스케줄 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 캠프/라우트 열 목록 (X축) - 마스터에 등록된 캠프/라우트 + 기사 등록 캠프/라우트 모두 통합
  const routeColumns = useMemo<RouteColumn[]>(() => {
    const colMap = new Map<string, RouteColumn>();

    // 1. 마스터 캠프 & 라우터 목록 반영
    const campMap = new Map(masterCamps.map(c => [c.id, c.name]));
    masterRoutes.forEach(r => {
      const campName = campMap.get(r.campId);
      if (campName) {
        const key = `${campName}/${r.name}`;
        const shortCamp = campName.replace('남양주', '남').replace('구리', '구');
        colMap.set(key, {
          key,
          campName,
          routeName: r.name,
          displayName: `${shortCamp}/${r.name}`,
        });
      }
    });

    // 2. 기사에게 배정된 캠프/라우터도 누락 없이 추가
    drivers.forEach(d => {
      const camps = parseCamps(d.camp);
      const routes = parseRoutes(d.routes);
      camps.forEach((camp, i) => {
        const route = routes[i] || routes[0] || '기본';
        const key = `${camp}/${route}`;
        if (!colMap.has(key)) {
          const shortCamp = camp.replace('남양주', '남').replace('구리', '구');
          colMap.set(key, {
            key,
            campName: camp,
            routeName: route,
            displayName: `${shortCamp}/${route}`,
          });
        }
      });
    });

    let cols = Array.from(colMap.values());

    // 필터링 적용
    if (campFilter) {
      cols = cols.filter(c => c.campName.toLowerCase() === campFilter.toLowerCase());
    }
    if (routeFilter) {
      cols = cols.filter(c => c.routeName.toLowerCase().includes(routeFilter.toLowerCase()));
    }

    // 캠프명 오름차순 -> 라우터명 오름차순 정렬
    cols.sort((a, b) => {
      const campComp = a.campName.localeCompare(b.campName, undefined, { numeric: true });
      if (campComp !== 0) return campComp;
      return a.routeName.localeCompare(b.routeName, undefined, { numeric: true });
    });

    return cols;
  }, [masterCamps, masterRoutes, drivers, campFilter, routeFilter]);

  // 필터 옵션: 회사에 등록된 모든 캠프를 완벽하게 표시
  const availableCamps = useMemo(() => {
    const set = new Set<string>();
    masterCamps.forEach(c => set.add(c.name));
    drivers.forEach(d => parseCamps(d.camp).forEach(c => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [masterCamps, drivers]);

  // 필터 옵션: 선택된 캠프에 등록된 모든 라우터 표시
  const availableRoutes = useMemo(() => {
    if (!campFilter) return [];
    const set = new Set<string>();
    
    const targetCamp = masterCamps.find(c => c.name.toLowerCase() === campFilter.toLowerCase());
    if (targetCamp) {
      masterRoutes.filter(r => r.campId === targetCamp.id).forEach(r => set.add(r.name));
    }

    drivers
      .filter(d => parseCamps(d.camp).some(c => c.toLowerCase() === campFilter.toLowerCase()))
      .forEach(d => parseRoutes(d.routes).forEach(r => set.add(r)));

    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [masterCamps, masterRoutes, drivers, campFilter]);

  // 필터링된 기사 목록 (검색어, 계약형태)
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = matchesDriverSearch(searchTerm, {
        name: d.name,
        phone: d.phone,
        camp: d.camp,
        routes: d.routes,
        driverCode: d.driverCode,
        contractType: d.contractType,
        id: d.id,
      });

      const matchesContract =
        contractTypeFilter === '' || d.contractType === contractTypeFilter;

      return matchesSearch && matchesContract;
    });
  }, [drivers, searchTerm, contractTypeFilter]);

  // 날짜별/구역별 배정 맵 ("2026-09-01_남양주3/905CD" -> SlotAssignment)
  const [slotAssignments, setSlotAssignments] = useState<Record<string, SlotAssignment>>(() => {
    try {
      const saved = localStorage.getItem('fleetsync_slot_assignments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 상태 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem('fleetsync_slot_assignments', JSON.stringify(slotAssignments));
    } catch {
      // ignore
    }
  }, [slotAssignments]);

  // 특정 날짜/라우터에 배정된 기사 가져오기
  const getSlotAssignment = useCallback(
    (dateStr: string, routeKey: string): SlotAssignment | undefined => {
      const slotKey = `${dateStr}_${routeKey}`;
      
      if (slotAssignments[slotKey]) {
        const assignment = slotAssignments[slotKey];
        const currentStatus = shiftsMap[dateStr]?.[assignment.driverId] || assignment.status;
        return {
          ...assignment,
          status: currentStatus,
        };
      }

      return undefined;
    },
    [slotAssignments, shiftsMap]
  );

  // 미배정 / 가용 기사 목록
  const unassignedDrivers = useMemo(() => {
    return filteredDrivers;
  }, [filteredDrivers]);

  // 기사 배정 처리 (드래그&드롭 또는 모달에서 선택) - 하루 1기사 1라우트 배정 원칙 (중복 방지)
  const handleAssignDriver = async (dateStr: string, routeKey: string, driverId: number) => {
    try {
      const targetDriver = drivers.find(d => d.id === driverId);
      if (!targetDriver) return;

      const targetSlotKey = `${dateStr}_${routeKey}`;
      const newAssignment: SlotAssignment = {
        driverId: targetDriver.id,
        driverName: targetDriver.name,
        contractType: targetDriver.contractType,
        status: targetDriver.contractType as ShiftStatus,
      };

      // 1. 슬롯 배정 상태 업데이트: 동일 날짜(dateStr)에 이 기사가 배정된 기존 다른 라우트 슬롯이 있다면 자동 제거하여 1일 1배정 보장
      setSlotAssignments(prev => {
        const next = { ...prev };
        
        Object.keys(next).forEach(key => {
          if (key.startsWith(`${dateStr}_`)) {
            // 본인 배정 제거
            if (next[key].driverId === driverId) {
              delete next[key];
            } else if (next[key].backupDriverId === driverId) {
              // 대차로 들어가 있던 것도 해제
              next[key] = {
                ...next[key],
                backupAssigned: false,
                backupDriverId: undefined,
                backupDriverName: undefined,
                backupContractType: undefined,
              };
            }
          }
        });

        next[targetSlotKey] = newAssignment;
        return next;
      });

      // 2. 서버 근무 상태 동기화
      await ApiService.updateShiftCell(driverId, dateStr, targetDriver.contractType as ShiftStatus);

      showToast('success', `${targetDriver.name} 기사가 ${dateStr} [${routeKey}] 구역에 배정되었습니다.`);
      setSelectedSlot(null);
    } catch (err: any) {
      console.error('[handleAssignDriver error]:', err);
      showToast('error', err.message || '기사 배정에 실패했습니다.');
    }
  };

  // 배정 해제 / 삭제
  const handleUnassignDriver = (dateStr: string, routeKey: string) => {
    const slotKey = `${dateStr}_${routeKey}`;
    setSlotAssignments(prev => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });
    showToast('success', '배정이 해제되었습니다.');
    setSelectedSlot(null);
  };

  // 휴무 처리
  const handleSetOffDay = async (dateStr: string, routeKey: string, driverId: number) => {
    try {
      const slotKey = `${dateStr}_${routeKey}`;
      setSlotAssignments(prev => {
        if (!prev[slotKey]) return prev;
        return {
          ...prev,
          [slotKey]: {
            ...prev[slotKey],
            status: '휴무',
            // 휴무 전환 시 대차가 지정되어 있지 않으면 대차 미지정 상태
          },
        };
      });

      await ApiService.updateShiftCell(driverId, dateStr, '휴무');
      setSelectedSlot(null);
    } catch (err: any) {
      showToast('error', err.message || '휴무 지정 실패');
    }
  };

  // 대차(백업) 기사 지정
  const handleAssignBackup = async (dateStr: string, routeKey: string, backupDriverId: number) => {
    try {
      const backupDriver = drivers.find(d => d.id === backupDriverId);
      if (!backupDriver) return;

      const slotKey = `${dateStr}_${routeKey}`;

      setSlotAssignments(prev => {
        const next = { ...prev };

        // 대차 기사가 당일 다른 곳에 배정되어 있었다면 그곳에서 제거
        Object.keys(next).forEach(key => {
          if (key.startsWith(`${dateStr}_`)) {
            if (next[key].driverId === backupDriverId) {
              delete next[key];
            } else if (next[key].backupDriverId === backupDriverId && key !== slotKey) {
              next[key] = {
                ...next[key],
                backupAssigned: false,
                backupDriverId: undefined,
                backupDriverName: undefined,
                backupContractType: undefined,
              };
            }
          }
        });

        if (next[slotKey]) {
          next[slotKey] = {
            ...next[slotKey],
            backupAssigned: true,
            backupDriverId: backupDriver.id,
            backupDriverName: backupDriver.name,
            backupContractType: backupDriver.contractType,
          };
        }
        return next;
      });

      await ApiService.updateShiftCell(backupDriverId, dateStr, backupDriver.contractType as ShiftStatus);
      showToast('success', `${backupDriver.name} 기사가 대차 기사로 지정되었습니다.`);
      setSelectedSlot(null);
    } catch (err: any) {
      showToast('error', err.message || '대차 기사 지정 실패');
    }
  };

  // 대차(백업) 기사 해제
  const handleRemoveBackup = (dateStr: string, routeKey: string) => {
    const slotKey = `${dateStr}_${routeKey}`;
    setSlotAssignments(prev => {
      if (!prev[slotKey]) return prev;
      return {
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          backupAssigned: false,
          backupDriverId: undefined,
          backupDriverName: undefined,
          backupContractType: undefined,
        },
      };
    });
    showToast('success', '대차 기사 지정이 해제되었습니다.');
    setSelectedSlot(null);
  };

  // 특정 일자에 해당 기사가 다른 라우터에 이미 배정되어 있는지 확인
  const getDriverAssignmentOnDate = useCallback(
    (dateStr: string, driverId: number): { routeKey: string; isBackup?: boolean } | undefined => {
      for (const [key, assignment] of Object.entries(slotAssignments)) {
        if (key.startsWith(`${dateStr}_`)) {
          const routeKey = key.slice(dateStr.length + 1);
          if (assignment.driverId === driverId) {
            return { routeKey, isBackup: false };
          }
          if (assignment.backupDriverId === driverId) {
            return { routeKey, isBackup: true };
          }
        }
      }
      return undefined;
    },
    [slotAssignments]
  );

  const resetFilters = () => {
    setSearchTerm('');
    setCampFilter('');
    setContractTypeFilter('');
    setRouteFilter('');
  };

  return {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    drivers,
    filteredDrivers,
    unassignedDrivers,
    routeColumns,
    dateRows,
    availableCamps,
    availableRoutes,
    searchTerm,
    getDriverAssignmentOnDate,
    setSearchTerm,
    campFilter,
    setCampFilter,
    contractTypeFilter,
    setContractTypeFilter,
    routeFilter,
    setRouteFilter,
    resetFilters,
    weekOfYearInfo,
    loading,
    error,
    selectedSlot,
    setSelectedSlot,
    getSlotAssignment,
    handleAssignDriver,
    handleUnassignDriver,
    handleSetOffDay,
    handleAssignBackup,
    handleRemoveBackup,
    slotAssignments,
    showToast,
    toastMessage,
    reload: loadData,
  };
}
