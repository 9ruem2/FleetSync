import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleGridRow, ShiftStatus } from '../models/schedule.model';
import { ApiService } from '../services/apiService';
import { matchesDriverSearch } from '../utils/searchFilter';
import { getAllDriverRoutes, parseCamps } from '../utils/routeUtils';

export type ScheduleViewMode = 'weekly' | 'monthly';

export function useScheduleViewModel() {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('weekly');
  const [gridRows, setGridRows] = useState<ScheduleGridRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [campFilter, setCampFilter] = useState<string>('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>('2026-08-11');

  const [activeCell, setActiveCell] = useState<{
    driverId: number;
    driverName: string;
    routeNumber: string;
    date: string;
    currentStatus: ShiftStatus;
    backupAssigned?: boolean;
    backupDriverName?: string;
  } | null>(null);

  const [backupTarget, setBackupTarget] = useState<{
    date: string;
    routeNumber: string;
    originalDriverId: number;
    originalDriverName: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const weekOfYearInfo = useMemo(() => {
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const base = new Date(y, m - 1, dNum);
    const currentDay = base.getDay(); // 0 = Sun, 6 = Sat
    const sunday = new Date(y, m - 1, dNum - currentDay);

    // Using Thursday of the week to get reference year
    const thursday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 4);
    const year = thursday.getFullYear();

    // First Sunday of the year (on or before Jan 1)
    const jan1 = new Date(year, 0, 1);
    const jan1Sunday = new Date(year, 0, 1 - jan1.getDay());

    const diffMs = sunday.getTime() - jan1Sunday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return { year, weekNumber };
  }, [selectedDate]);

  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNumber: number; isWeekend: boolean }[] = [];
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const base = new Date(y, m - 1, dNum);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    if (viewMode === 'weekly') {
      const currentDay = base.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const sunday = new Date(y, m - 1, dNum - currentDay);

      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        const dayIdx = d.getDay();
        dates.push({
          dateStr,
          dayName: dayNames[dayIdx],
          dayNumber: d.getDate(),
          isWeekend: dayIdx === 0 || dayIdx === 6
        });
      }
    } else {
      const year = base.getFullYear();
      const month = base.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const monthStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const dayIdx = d.getDay();
        dates.push({
          dateStr,
          dayName: dayNames[dayIdx],
          dayNumber: day,
          isWeekend: dayIdx === 0 || dayIdx === 6
        });
      }
    }
    return dates;
  }, [viewMode, selectedDate]);

  const startDate = dateColumns[0]?.dateStr || '2026-08-01';
  const endDate = dateColumns[dateColumns.length - 1]?.dateStr || '2026-08-31';

  const loadScheduleGrid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getScheduleGrid(startDate, endDate);
      setGridRows(data);
    } catch (err: any) {
      setError(err.message || '스케줄 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadScheduleGrid();
  }, [loadScheduleGrid]);

  const availableCamps = useMemo(() => {
    const set = new Set<string>();
    gridRows.forEach(row => {
      parseCamps(row.camp).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }, [gridRows]);

  const availableRoutes = useMemo(() => {
    // Route filter disabled if Camp is not selected
    if (!campFilter) return [];

    const set = new Set<string>();
    gridRows
      .filter(row => parseCamps(row.camp).some(c => c.toLowerCase() === campFilter.toLowerCase()))
      .forEach(row => {
        getAllDriverRoutes({
          routes: row.routes,
        }).forEach(r => set.add(r));
      });
    return Array.from(set).sort();
  }, [gridRows, campFilter]);

  const filteredGridRows = useMemo(() => {
    return gridRows.filter(row => {
      const matchesSearch = matchesDriverSearch(searchTerm, {
        name: row.driverName,
        phone: row.phone,
        camp: row.camp,
        routes: row.routes,
        driverCode: row.driverCode,
        contractType: row.contractType,
        id: row.driverId,
      });

      const matchesCamp =
        campFilter === '' || parseCamps(row.camp).some(c => c.toLowerCase() === campFilter.toLowerCase());

      const matchesContract =
        contractTypeFilter === '' || row.contractType === contractTypeFilter;

      const allRoutes = getAllDriverRoutes({
        routes: row.routes,
      });
      const matchesRoute =
        routeFilter === '' ||
        allRoutes.some(r => r.toLowerCase().includes(routeFilter.toLowerCase()));

      return matchesSearch && matchesCamp && matchesContract && matchesRoute;
    });
  }, [gridRows, searchTerm, campFilter, contractTypeFilter, routeFilter]);

  const handleUpdateCellStatus = async (driverId: number, date: string, status: ShiftStatus) => {
    try {
      await ApiService.updateShiftCell(driverId, date, status);
      showToast('success', '근무 상태가 수정되었습니다.');
      setActiveCell(null);
      await loadScheduleGrid();
    } catch (err: any) {
      showToast('error', err.message || '근무 상태 수정 실패');
    }
  };

  const openBackupAssign = (driverId: number, driverName: string, routeNumber: string, date: string) => {
    setActiveCell(null);
    setBackupTarget({
      date,
      routeNumber,
      originalDriverId: driverId,
      originalDriverName: driverName
    });
  };

  const getPrimaryRouteForRow = (row: ScheduleGridRow, _date: string): string => {
    const active = getAllDriverRoutes({ routes: row.routes });
    return active[0] ?? '';
  };

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
    gridRows,
    filteredGridRows,
    availableCamps,
    availableRoutes,
    searchTerm,
    setSearchTerm,
    campFilter,
    setCampFilter,
    contractTypeFilter,
    setContractTypeFilter,
    routeFilter,
    setRouteFilter,
    resetFilters,
    dateColumns,
    weekOfYearInfo,
    loading,
    error,
    activeCell,
    setActiveCell,
    backupTarget,
    setBackupTarget,
    toastMessage,
    handleUpdateCellStatus,
    openBackupAssign,
    getPrimaryRouteForRow,
    reload: loadScheduleGrid
  };
}
