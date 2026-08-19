export type WeekPattern = '1,3' | '2,4' | 'both';

/** 쉼표 구분 라우트 문자열 → 배열 */
export function parseRoutes(input: string): string[] {
  return input
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
}

/** 라우트 배열 → 쉼표 구분 문자열 */
export function joinRoutes(routes: string[]): string {
  return routes.join(', ');
}

/** 해당 날짜가 월内 몇 주차인지 (1~5) */
export function getWeekOfMonth(dateStr: string): number {
  const day = new Date(dateStr).getDate();
  return Math.ceil(day / 7);
}

/** 1,3주 / 2,4주 그룹 판별 */
export function getWeekGroupInMonth(dateStr: string): '1,3' | '2,4' {
  const week = getWeekOfMonth(dateStr);
  return week % 2 === 0 ? '2,4' : '1,3';
}

/** 기사의 전체 라우트 (중복 제거) */
export function getAllDriverRoutes(fields: {
  routesWeek13: string;
  routesWeek24: string;
  routeNumber?: string;
}): string[] {
  const set = new Set<string>();
  parseRoutes(fields.routesWeek13).forEach(r => set.add(r));
  parseRoutes(fields.routesWeek24).forEach(r => set.add(r));
  if (fields.routeNumber) set.add(fields.routeNumber);
  return Array.from(set);
}

/** 특정 주차 그룹의 담당 라우트 */
export function getRoutesForWeekGroup(
  fields: { routesWeek13: string; routesWeek24: string },
  weekGroup: '1,3' | '2,4'
): string[] {
  return weekGroup === '1,3'
    ? parseRoutes(fields.routesWeek13)
    : parseRoutes(fields.routesWeek24);
}

/** weekPattern에 따라 해당 날짜의 담당 라우트 */
export function getActiveRoutesForDate(
  fields: {
    routesWeek13: string;
    routesWeek24: string;
    weekPattern: WeekPattern;
    routeNumber?: string;
  },
  dateStr: string
): string[] {
  const group = getWeekGroupInMonth(dateStr);
  const routes: string[] = [];

  if (fields.weekPattern === '1,3' || fields.weekPattern === 'both') {
    if (group === '1,3') routes.push(...parseRoutes(fields.routesWeek13));
  }
  if (fields.weekPattern === '2,4' || fields.weekPattern === 'both') {
    if (group === '2,4') routes.push(...parseRoutes(fields.routesWeek24));
  }

  const unique = Array.from(new Set(routes));
  if (unique.length > 0) return unique;
  if (fields.routeNumber) return [fields.routeNumber];
  return getAllDriverRoutes(fields);
}

/** 저장용 primary route (백업/레거시 호환) */
export function derivePrimaryRoute(fields: {
  routesWeek13: string;
  routesWeek24: string;
  weekPattern: WeekPattern;
}): string {
  if (fields.weekPattern === '2,4') {
    const r = parseRoutes(fields.routesWeek24);
    if (r.length > 0) return r[0];
  }
  const r13 = parseRoutes(fields.routesWeek13);
  if (r13.length > 0) return r13[0];
  const r24 = parseRoutes(fields.routesWeek24);
  return r24[0] ?? '';
}

/** 검색용 라우트 문자열 */
export function getSearchableRouteText(fields: {
  routesWeek13: string;
  routesWeek24: string;
  routeNumber?: string;
  driverCode?: string;
}): string {
  return [
    fields.driverCode ?? '',
    fields.routeNumber ?? '',
    fields.routesWeek13,
    fields.routesWeek24,
    ...getAllDriverRoutes(fields),
  ].join(' ');
}
