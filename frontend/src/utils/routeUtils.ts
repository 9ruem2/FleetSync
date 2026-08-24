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

/**
 * 캠프별 축약명 매핑 테이블
 * 예외적이거나 자주 쓰이는 지명 축약 규칙을 관리합니다.
 */
const CAMP_SHORT_MAP: Record<string, string> = {
  '남양주': '남',
  '구리': '구',
  '서울': '서',
  '인천': '인',
  '하남': '하',
  '일산': '일',
  '김포': '김',
  '부천': '부',
  '수원': '수',
  '성남': '성',
  '용인': '용',
  '화성': '화',
  '안양': '안',
  '평택': '평',
  '의정부': '의',
  '파주': '파',
};

/**
 * 캠프명을 뷰/미리보기용 축약명으로 변환합니다.
 * 예: '남양주1' -> '남1', '구리' -> '구', '포천2' -> '포2'
 */
export function getShortCampName(campName?: string): string {
  if (!campName) return '';

  // 1. 등록된 매핑 테이블에서 치환 (예: '남양주1' -> '남1')
  for (const [full, short] of Object.entries(CAMP_SHORT_MAP)) {
    if (campName.includes(full)) {
      return campName.replace(full, short);
    }
  }

  // 2. 매핑에 없는 신규 캠프: 한글 지명(2자 이상) + 뒤 번호/문자 구조일 경우 첫 글자만 축약 (예: '원주1' -> '원1')
  const match = campName.match(/^([가-힣]{2,})(\d.*)?$/);
  if (match) {
    const [, region, rest = ''] = match;
    return `${region.charAt(0)}${rest}`;
  }

  return campName;
}

