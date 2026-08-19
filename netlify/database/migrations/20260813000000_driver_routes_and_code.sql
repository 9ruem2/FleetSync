-- 기사 사용 ID, 주차별 담당 라우트 필드 추가
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_code text NOT NULL DEFAULT '';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS routes_week13 text NOT NULL DEFAULT '';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS routes_week24 text NOT NULL DEFAULT '';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS week_pattern text NOT NULL DEFAULT '1,3';

-- 기존 route_number → 1,3주 라우트로 이전
UPDATE drivers
SET routes_week13 = route_number
WHERE routes_week13 = '' AND route_number <> '';
