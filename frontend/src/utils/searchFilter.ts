import { extractPhoneDigits, formatPhoneNumber } from './phoneFormat';

const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** 한글 문자열에서 초성만 추출 (예: "홍길동" → "ㅎㄱㄷ") */
export function getKoreanChosung(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      result += CHOSUNG[Math.floor((code - 0xac00) / 588)];
    } else {
      result += char;
    }
  }
  return result;
}

export interface SearchableDriverFields {
  name: string;
  phone: string;
  routeNumber: string;
  camp?: string;
  driverCode?: string;
  routesWeek13?: string;
  routesWeek24?: string;
  contractType?: string;
  id?: number;
}

/**
 * 기사명(초성 포함), 연락처(일부 번호), 캠프, 라우트, ID 등 통합 검색.
 * query가 비어 있으면 true.
 */
export function matchesDriverSearch(query: string, fields: SearchableDriverFields): boolean {
  const q = query.trim();
  if (!q) return true;

  const qLower = q.toLowerCase();
  const qDigits = extractPhoneDigits(q);
  const qChosung = getKoreanChosung(q);

  const name = fields.name;
  const nameLower = name.toLowerCase();
  const nameChosung = getKoreanChosung(name);
  const route = [
    fields.routeNumber,
    fields.routesWeek13 ?? '',
    fields.routesWeek24 ?? '',
    fields.driverCode ?? '',
  ].join(' ');
  const routeLower = route.toLowerCase();
  const campLower = (fields.camp ?? '').toLowerCase();
  const phone = fields.phone;
  const phoneFormatted = formatPhoneNumber(phone);
  const phoneDigits = extractPhoneDigits(phone);
  const contractType = fields.contractType ?? '';
  const idStr = fields.id !== undefined ? String(fields.id) : '';

  // 이름: 전체/부분 일치
  if (nameLower.includes(qLower)) return true;

  // 이름: 초성 검색 (예: "ㅎㄱ" → "홍길동")
  if (qChosung.length > 0 && nameChosung.includes(qChosung)) return true;

  // 캠프: 부분 일치
  if (campLower.includes(qLower)) return true;

  // 라우트: 부분 일치 (예: "101" → "101A")
  if (routeLower.includes(qLower)) return true;

  // 계약 형태
  if (contractType.includes(q)) return true;

  // 사용 ID
  const driverCode = fields.driverCode ?? '';
  if (driverCode.toLowerCase().includes(qLower)) return true;

  // ID
  if (idStr.includes(q)) return true;

  // 연락처: 하이픈 포함 형식 부분 일치
  if (phone.includes(q)) return true;
  if (phoneFormatted.includes(q)) return true;
  if (phoneFormatted.toLowerCase().includes(qLower)) return true;

  // 연락처: 숫자만 부분 일치 (예: "1234" → "010-1234-5678")
  if (qDigits.length > 0 && phoneDigits.includes(qDigits)) return true;

  return false;
}
