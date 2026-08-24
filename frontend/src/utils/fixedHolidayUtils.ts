import { Driver, DriverFixedHoliday } from '../models/driver.model';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
export const CYCLE_ORDER = ['매주', '1,3주', '2,4주', '1주', '2주', '3주', '4주', '5주'];
export const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 특정 날짜(YYYY-MM-DD)가 기사의 고정 휴무 주기 및 요일 조건에 부합하는지 판별
 */
export function isDateMatchingFixedHoliday(
  dateStr: string,
  weekCycle: string,
  dayOfWeek: string,
): boolean {
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return false;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayName = DAY_NAMES[date.getDay()];

    // 요일 검사 (쉼표로 구분된 복수 요일 지원, 예: '월,수,금')
    const targetDays = (dayOfWeek || '')
      .split(',')
      .map(s => s.replace('요일', '').trim())
      .filter(Boolean);

    if (!targetDays.includes(dayName)) {
      return false;
    }

    // 주차 검사 (해당 월의 N번째 해당 요일)
    const dayNumber = date.getDate();
    const weekNum = Math.ceil(dayNumber / 7);

    const cycle = weekCycle.replace(/\s+/g, '');
    if (cycle === '매주') {
      return true;
    } else if (cycle === '1,3주' || cycle === '1,3') {
      return weekNum === 1 || weekNum === 3 || weekNum === 5;
    } else if (cycle === '2,4주' || cycle === '2,4') {
      return weekNum === 2 || weekNum === 4;
    } else if (cycle === '1주') {
      return weekNum === 1;
    } else if (cycle === '2주') {
      return weekNum === 2;
    } else if (cycle === '3주') {
      return weekNum === 3;
    } else if (cycle === '4주') {
      return weekNum === 4;
    } else if (cycle === '5주') {
      return weekNum === 5;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 특정 기사가 특정 날짜에 고정 휴무에 해당하는지 확인하고, 해당 고정 휴무 규칙을 반환
 */
export function getDriverFixedHolidayOnDate(
  driver: Driver | undefined,
  dateStr: string,
): DriverFixedHoliday | undefined {
  if (!driver || !driver.fixedHolidays || driver.fixedHolidays.length === 0) {
    return undefined;
  }
  return driver.fixedHolidays.find(fh =>
    isDateMatchingFixedHoliday(dateStr, fh.weekCycle, fh.dayOfWeek)
  );
}

/**
 * 고정 휴무 목록 정렬 (매주 -> 1,3주 -> 2,4주 -> 1주... 및 일->월->화...)
 */
export function sortFixedHolidays<T extends { weekCycle: string; dayOfWeek: string }>(holidays: T[]): T[] {
  return [...holidays].sort((a, b) => {
    const cycleA = CYCLE_ORDER.indexOf(a.weekCycle);
    const cycleB = CYCLE_ORDER.indexOf(b.weekCycle);
    const idxA = cycleA === -1 ? 999 : cycleA;
    const idxB = cycleB === -1 ? 999 : cycleB;

    if (idxA !== idxB) {
      return idxA - idxB;
    }

    const firstDayA = (a.dayOfWeek || '').split(',')[0]?.trim() || '';
    const firstDayB = (b.dayOfWeek || '').split(',')[0]?.trim() || '';
    const dayIdxA = WEEK_DAYS.indexOf(firstDayA);
    const dayIdxB = WEEK_DAYS.indexOf(firstDayB);
    const validDayA = dayIdxA === -1 ? 999 : dayIdxA;
    const validDayB = dayIdxB === -1 ? 999 : dayIdxB;

    return validDayA - validDayB;
  });
}
