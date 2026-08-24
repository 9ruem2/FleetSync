-- 신규 테이블: driver_route_patterns (기사 정기 노선 패턴 - 주차/요일별 캠프 및 라우터)
CREATE TABLE IF NOT EXISTS public.driver_route_patterns (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  week_cycle VARCHAR(50) NOT NULL,     -- '매주', '1,3주', '2,4주', '1주'~'5주'
  day_of_week VARCHAR(100) NOT NULL,   -- '월', '화', '수', '목', '금', '토', '일' 또는 쉼표 구분 복수 요일
  camp_id BIGINT REFERENCES public.camps(id) ON DELETE SET NULL,
  camp_name VARCHAR(100) NOT NULL,     -- '남양주3', '남양주2' 등
  route_id BIGINT REFERENCES public.routes(id) ON DELETE SET NULL,
  route_name VARCHAR(100) NOT NULL,    -- '905CD', '518CD' 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_driver_route_patterns_driver_id ON public.driver_route_patterns(driver_id);

-- 코멘트 등록
COMMENT ON TABLE public.driver_route_patterns IS '기사별 주차 및 요일별 정기 배송 노선 패턴';
COMMENT ON COLUMN public.driver_route_patterns.week_cycle IS '주 단위 패턴 (매주, 1,3주, 2,4주 등)';
COMMENT ON COLUMN public.driver_route_patterns.day_of_week IS '담당 요일 (쉼표 구분 복수 요일 지원)';
COMMENT ON COLUMN public.driver_route_patterns.camp_name IS '담당 캠프명';
COMMENT ON COLUMN public.driver_route_patterns.route_name IS '담당 라우터 구역명';
