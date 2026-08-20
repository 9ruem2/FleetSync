/** 쉼표 구분 캠프 문자열 → 배열 */
export function parseCamps(input?: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
}

/** 쉼표 구분 라우트 문자열 → 배열 */
export function parseRoutes(input?: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
}

/** 라우트 배열 → 쉼표 구분 문자열 */
export function joinRoutes(routes: string[]): string {
  return routes.join(', ');
}

/** 기사의 전체 라우트 (중복 제거) */
export function getAllDriverRoutes(fields: { routes?: string }): string[] {
  return parseRoutes(fields.routes);
}

/** 검색용 라우트 문자열 */
export function getSearchableRouteText(fields: {
  routes?: string;
  driverCode?: string;
}): string {
  return [
    fields.driverCode ?? '',
    fields.routes ?? '',
  ].join(' ');
}
