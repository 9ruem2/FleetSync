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

const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 초성을 추출합니다 (영문/숫자/특수문자는 그대로 유지).
 * 예: "노승원" -> "ㄴㅅㅇ", "남양주4" -> "ㄴㅇㅈ4"
 */
export function getChosung(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const chosungIndex = Math.floor((code - 0xac00) / 588);
      result += CHOSUNG_LIST[chosungIndex];
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * 대상 문자열이 쿼리 문자열 또는 쿼리의 초성과 일치하는지 검사합니다.
 */
export function matchesTextOrChosung(target: string, query: string): boolean {
  if (!query) return true;
  const targetClean = target.toLowerCase();
  const queryClean = query.toLowerCase();

  // 1. 일반 문자열 포함
  if (targetClean.includes(queryClean)) return true;

  // 2. 대상의 초성 문자열 추출 후 쿼리 포함 검사 (예: "노승원"의 초성 "ㄴㅅㅇ"에 "ㄴㅅ" 포함 여부)
  const targetChosung = getChosung(targetClean);
  if (targetChosung.includes(queryClean)) return true;

  // 3. 띄어쓰기 제거 후 초성 매칭 (예: "남양주 4" -> "ㄴㅇㅈ4" 매칭)
  const targetNoSpace = targetClean.replace(/\s+/g, '');
  const queryNoSpace = queryClean.replace(/\s+/g, '');
  if (getChosung(targetNoSpace).includes(queryNoSpace)) return true;

  return false;
}

/**
 * 기사명, 연락처, 캠프, 라우트, ID 등 통합 검색 (일반 텍스트 및 한글 초성 검색 지원).
 * query가 비어 있으면 true.
 */
export function matchesDriverSearch(query: string, fields: SearchableDriverFields): boolean {
  const q = query.trim();
  if (!q) return true;

  const qDigits = extractPhoneDigits(q);

  const name = fields.name;
  const camp = fields.camp ?? '';
  const routes = fields.routes ?? '';
  const driverCode = fields.driverCode ?? '';
  const phone = fields.phone;
  const phoneFormatted = formatPhoneNumber(phone);
  const phoneDigits = extractPhoneDigits(phone);
  const contractType = fields.contractType ?? '';
  const idStr = fields.id !== undefined ? String(fields.id) : '';

  // 1. 기사명 (일반 및 초성 검색: 예: 'ㄴㅅㅇ' -> '노승원')
  if (matchesTextOrChosung(name, q)) return true;

  // 2. 캠프 (일반 및 초성 검색: 예: 'ㄴㅇㅈ' -> '남양주')
  if (matchesTextOrChosung(camp, q)) return true;

  // 3. 라우트 및 드라이버 코드 (예: '504', 'ㄴㅅ')
  if (matchesTextOrChosung(routes, q)) return true;
  if (matchesTextOrChosung(driverCode, q)) return true;

  // 4. 계약 형태 (일반 텍스트 일치만 허용, 초성 검색 제외)
  if (contractType && contractType.toLowerCase().includes(q.toLowerCase())) return true;

  // 5. 연락처: 숫자 부분 검색 or 하이픈 포함 검색
  if (phone.includes(q) || phoneFormatted.includes(q)) return true;
  if (qDigits && phoneDigits.includes(qDigits)) return true;

  // 6. ID (시스템 키 번호)
  if (idStr === q || idStr.includes(q)) return true;

  return false;
}

