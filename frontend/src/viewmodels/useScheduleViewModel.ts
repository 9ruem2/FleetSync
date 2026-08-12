import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleGridRow, ShiftStatus } from '../models/schedule.model';
import { ApiService } from '../services/apiService';
import { matchesDriverSearch } from '../utils/searchFilter';

export type ScheduleViewMode = 'weekly' | 'monthly';

export function useScheduleViewModel() {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('weekly');
  const [gridRows, setGridRows] = useState<ScheduleGridRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
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

  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNumber: number; isWeekend: boolean }[] = [];
    const base = new Date(selectedDate);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    if (viewMode === 'weekly') {
      const currentDay = base.getDay();
      const diffToMon = base.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(base.setDate(diffToMon));

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
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

  const availableRoutes = useMemo(() => {
    const set = new Set(gridRows.map(r => r.routeNumber));
    return Array.from(set).sort();
  }, [gridRows]);

  const filteredGridRows = useMemo(() => {
    return gridRows.filter(row => {
      const matchesSearch = matchesDriverSearch(searchTerm, {
        name: row.driverName,
        phone: row.phone,
        routeNumber: row.routeNumber,
        contractType: row.contractType,
        id: row.driverId,
      });

      const matchesContract =
        contractTypeFilter === '' || row.contractType === contractTypeFilter;

      const matchesRoute =
        routeFilter === '' || row.routeNumber.toLowerCase().includes(routeFilter.toLowerCase());

      return matchesSearch && matchesContract && matchesRoute;
    });
  }, [gridRows, searchTerm, contractTypeFilter, routeFilter]);

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

  const resetFilters = () => {
    setSearchTerm('');
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
    availableRoutes,
    searchTerm,
    setSearchTerm,
    contractTypeFilter,
    setContractTypeFilter,
    routeFilter,
    setRouteFilter,
    resetFilters,
    dateColumns,
    loading,
    error,
    activeCell,
    setActiveCell,
    backupTarget,
    setBackupTarget,
    toastMessage,
    handleUpdateCellStatus,
    openBackupAssign,
    reload: loadScheduleGrid
  };
}
