-- ==============================================================================
-- 1. 테이블 생성 (driver_fixed_holidays)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.driver_fixed_holidays (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  week_cycle VARCHAR(50) NOT NULL,    -- '매주', '1,3주', '2,4주', '1주'~'5주'
  day_of_week VARCHAR(100) NOT NULL,  -- 복수 요일 쉼표 구분 (예: '월,수', '토,일')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_driver_fixed_holidays_driver_id ON public.driver_fixed_holidays(driver_id);

-- ==============================================================================
-- 2. 기존 고정 휴무일 정리 (중복 방지)
-- ==============================================================================
DELETE FROM public.driver_fixed_holidays
WHERE driver_id IN (
  SELECT id FROM public.drivers 
  WHERE name IN ('노승원', '정기철', '김재형', '이경병', '김소현', '오지훈', '장승필', '정승필', '박현수')
);

-- ==============================================================================
-- 3. 1,3주차 / 2,4주차 고정 휴무일 일괄 삽입
-- ==============================================================================
INSERT INTO public.driver_fixed_holidays (driver_id, week_cycle, day_of_week)
SELECT 
  d.id AS driver_id,
  v.week_cycle,
  v.day_of_week
FROM (
  VALUES
    -- 1. 노승원 (백업)
    ('노승원', '1,3주', '일,월'),
    ('노승원', '2,4주', '일'),

    -- 2. 정기철 (백업)
    ('정기철', '1,3주', '금,토'),
    ('정기철', '2,4주', '토'),

    -- 3. 김재형 (백업)
    ('김재형', '1,3주', '일,월'),
    ('김재형', '2,4주', '일,월'),

    -- 4. 이경병 (백업)
    ('이경병', '1,3주', '수'),
    ('이경병', '2,4주', '월,화,수'),

    -- 5. 김소현 (백업)
    ('김소현', '1,3주', '목,토'),
    ('김소현', '2,4주', '목,금'),

    -- 6. 오지훈 (백업)
    ('오지훈', '1,3주', '수'),
    ('오지훈', '2,4주', '수,목'),

    -- 7. 장승필 / 정승필 (백업)
    ('장승필', '1,3주', '일,월'),
    ('장승필', '2,4주', '일'),

    -- 8. 박현수 (백업)
    ('박현수', '1,3주', '월,수,목'),
    ('박현수', '2,4주', '수,목')
) AS v(driver_name, week_cycle, day_of_week)
JOIN public.drivers d 
  ON d.name = v.driver_name 
  OR (v.driver_name = '장승필' AND d.name = '정승필')
  OR (v.driver_name = '정승필' AND d.name = '장승필');
