/** 숫자만 추출 */
export function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** 010-xxxx-xxxx 형식으로 포맷 (입력/표시 공용) */
export function formatPhoneNumber(phone: string): string {
  const digits = extractPhoneDigits(phone);

  if (!digits) return '';

  if (digits.startsWith('010')) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  // 010 외 번호는 3-4-4 패턴으로 표시
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/** 저장용: 010-xxxx-xxxx (11자리 미만이면 포맷 가능한 만큼만) */
export function normalizePhoneNumber(phone: string): string {
  return formatPhoneNumber(phone);
}
