-- 신규 테이블: driver_fixed_holidays (기사 고정 휴무일 설정)
CREATE TABLE IF NOT EXISTS public.driver_fixed_holidays (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  week_cycle VARCHAR(50) NOT NULL,    -- '매주', '1,3주', '2,4주', '1주', '2주', '3주', '4주', '5주'
  day_of_week VARCHAR(100) NOT NULL,  -- 복수 요일 쉼표 구분 (예: '월,수', '토,일', '화,목,금')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_driver_fixed_holidays_driver_id ON public.driver_fixed_holidays(driver_id);

-- 테이블 설명 및 권한 설정
COMMENT ON TABLE public.driver_fixed_holidays IS '기사별 정기 고정 휴무일 (주차 및 복수 요일 패턴)';
COMMENT ON COLUMN public.driver_fixed_holidays.week_cycle IS '주 단위 패턴 (매주, 1,3주, 2,4주 등)';
COMMENT ON COLUMN public.driver_fixed_holidays.day_of_week IS '휴무 요일 (쉼표 구분 복수 요일, 예: 월,수)';

