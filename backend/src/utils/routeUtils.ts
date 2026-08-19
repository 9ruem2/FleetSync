export type WeekPattern = '1,3' | '2,4' | 'both';

export function parseCamps(input?: string): string[] {
  if (!input) return [];
  return input.split(',').map(c => c.trim()).filter(Boolean);
}

export function parseRoutes(input: string): string[] {
  return input.split(',').map(r => r.trim()).filter(Boolean);
}

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

export function normalizeWeekPattern(value: string): WeekPattern {
  if (value === '2,4' || value === 'both') return value;
  return '1,3';
}

export function getWeekOfMonth(dateStr: string): number {
  const day = new Date(dateStr).getDate();
  return Math.ceil(day / 7);
}

export function getWeekGroupInMonth(dateStr: string): '1,3' | '2,4' {
  return getWeekOfMonth(dateStr) % 2 === 0 ? '2,4' : '1,3';
}

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
  return fields.routeNumber ? [fields.routeNumber] : [];
}
