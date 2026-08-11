import fs from 'fs';
import path from 'path';

/**
 * JSON 파일 기반 영구 저장소 유틸리티.
 * 데이터 변경 시마다 자동으로 JSON 파일에 기록하여
 * 서버 재시작 후에도 데이터가 보존됩니다.
 */

// 데이터 파일 저장 디렉토리 (backend/data/)
const DATA_DIR = path.resolve(__dirname, '../../data');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

/**
 * JSON 파일에서 데이터 배열 읽기.
 * 파일이 없거나 파싱 오류 시 빈 배열 반환.
 */
export function readJsonFile<T>(fileName: string): T[] {
  ensureDataDir();
  const filePath = getFilePath(fileName);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`[JsonStore] ${fileName} 파일 읽기 실패, 빈 배열 반환`);
    return [];
  }
}

/**
 * JSON 파일에 데이터 배열 쓰기 (전체 덮어쓰기).
 */
export function writeJsonFile<T>(fileName: string, data: T[]): void {
  ensureDataDir();
  const filePath = getFilePath(fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 시드(초기) 데이터 존재 여부 확인.
 * 파일이 없거나 빈 배열이면 false 반환.
 */
export function hasData(fileName: string): boolean {
  ensureDataDir();
  const filePath = getFilePath(fileName);

  if (!fs.existsSync(filePath)) return false;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}
