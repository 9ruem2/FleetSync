import { formatPhoneNumber, extractPhoneDigits } from './phoneFormat';

export interface SearchableDriverFields {
  name: string;
  phone: string;
  camp?: string;
  routes?: string;
  driverCode?: string;
  contractType?: string;
  id?: number;
}

/**
 * 기사명, 연락처, 캠프, 라우트, ID 등 통합 검색.
 * query가 비어 있으면 true.
 */
export function matchesDriverSearch(query: string, fields: SearchableDriverFields): boolean {
  const q = query.trim();
  if (!q) return true;

  const qLower = q.toLowerCase();
  const qDigits = extractPhoneDigits(q);

  const nameLower = fields.name.toLowerCase();
  const routeLower = [fields.routes ?? '', fields.driverCode ?? ''].join(' ').toLowerCase();
  const campLower = (fields.camp ?? '').toLowerCase();
  const phone = fields.phone;
  const phoneFormatted = formatPhoneNumber(phone);
  const phoneDigits = extractPhoneDigits(phone);
  const contractType = fields.contractType ?? '';
  const idStr = fields.id !== undefined ? String(fields.id) : '';

  // 이름
  if (nameLower.includes(qLower)) return true;

  // 연락처: 숫자 부분 검색 or 하이픈 포함 검색
  if (phone.includes(q) || phoneFormatted.includes(q)) return true;
  if (qDigits && phoneDigits.includes(qDigits)) return true;

  // 캠프
  if (campLower.includes(qLower)) return true;

  // 라우트 / driverCode
  if (routeLower.includes(qLower)) return true;

  // 계약 형태
  if (contractType.toLowerCase().includes(qLower)) return true;

  // ID (시스템 키 번호)
  if (idStr === q || idStr.includes(q)) return true;

  return false;
}
