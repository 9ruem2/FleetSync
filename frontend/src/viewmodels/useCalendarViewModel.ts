import { useState, useEffect, useCallback, useMemo } from 'react';
import { OffDayRecord } from '../models/schedule.model';
import { Driver } from '../models/driver.model';
import { ApiService } from '../services/apiService';

export function useCalendarViewModel() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-08-01'));
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

  // Fetch off-days and drivers
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [offDaysData, driversData] = await Promise.all([
        ApiService.getOffDays(),
        ApiService.getDrivers()
      ]);

      setOffDays(offDaysData);
      setAllDrivers(driversData);
    } catch (err: any) {
      setError(err.message || '휴무 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group off-days by date string "YYYY-MM-DD"
  const offDaysByDate = useMemo(() => {
    const map = new Map<string, OffDayRecord[]>();
    offDays.forEach(record => {
      const existing = map.get(record.date) || [];
      existing.push(record);
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
    setCurrentDate(new Date('2026-08-01'));
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
