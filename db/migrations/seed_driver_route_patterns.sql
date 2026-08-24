-- ==============================================================================
-- 1. 테이블 생성 (driver_route_patterns)
-- ==============================================================================
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

-- ==============================================================================
-- 2. 기존 패턴 정리 (중복 방지)
-- ==============================================================================
DELETE FROM public.driver_route_patterns
WHERE driver_id IN (
  SELECT id FROM public.drivers 
  WHERE name IN ('노승원', '정기철', '김재형', '이경병', '김소현', '오지훈', '정승필', '박현수')
);

-- ==============================================================================
-- 3. 1,3주차 / 2,4주차 고정노선 일괄 삽입
-- ==============================================================================
INSERT INTO public.driver_route_patterns (driver_id, week_cycle, day_of_week, camp_name, route_name)
VALUES
  -- ----------------------------------------------------------------------------
  -- 1. 노승원 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 화,수(남3/905CD), 목,금(남2/518CD), 토(남4/504AB)
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '1,3주', '화,수', '남양주3', '905CD'),
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '1,3주', '목,금', '남양주2', '518CD'),
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '1,3주', '토', '남양주4', '504AB'),
  -- 2,4주차: 월(남4/605D), 화(남3/905CD), 수,금,토(남3/903통), 목(남2/518CD)
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '2,4주', '월', '남양주4', '605D'),
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '2,4주', '화', '남양주3', '905CD'),
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '2,4주', '수,금,토', '남양주3', '903통'),
  ((SELECT id FROM public.drivers WHERE name = '노승원' LIMIT 1), '2,4주', '목', '남양주2', '518CD'),

  -- ----------------------------------------------------------------------------
  -- 2. 정기철 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 일,월(구2/905CD), 화(남4/508AB), 수(남4/505AB), 목(구2/002AB)
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '1,3주', '일,월', '구리2', '905CD'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '1,3주', '화', '남양주4', '508AB'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '1,3주', '수', '남양주4', '505AB'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '1,3주', '목', '구리2', '002AB'),
  -- 2,4주차: 일(구2/005CD), 월(구2/905CD), 화(남4/508AB), 수(남4/505AB), 목,금(구2/002AB)
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '2,4주', '일', '구리2', '005CD'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '2,4주', '월', '구리2', '905CD'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '2,4주', '화', '남양주4', '508AB'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '2,4주', '수', '남양주4', '505AB'),
  ((SELECT id FROM public.drivers WHERE name = '정기철' LIMIT 1), '2,4주', '목,금', '구리2', '002AB'),

  -- ----------------------------------------------------------------------------
  -- 3. 김재형 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 화(남4/605D), 수(남4/605C), 목(구2/002CD), 금(남3/903통), 토(구2/005CD)
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '1,3주', '화', '남양주4', '605D'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '1,3주', '수', '남양주4', '605C'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '1,3주', '목', '구리2', '002CD'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '1,3주', '금', '남양주3', '903통'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '1,3주', '토', '구리2', '005CD'),
  -- 2,4주차: 화(남4/605D), 수(남4/605C), 목,금(구2/002CD), 토(구2/005CD)
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '2,4주', '화', '남양주4', '605D'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '2,4주', '수', '남양주4', '605C'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '2,4주', '목,금', '구리2', '002CD'),
  ((SELECT id FROM public.drivers WHERE name = '김재형' LIMIT 1), '2,4주', '토', '구리2', '005CD'),

  -- ----------------------------------------------------------------------------
  -- 4. 이경병 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 일(남4/504C), 월(구2/905AB), 화(남4/505AB), 목(남4/502CD), 금,토(남3/808BCD)
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '1,3주', '일', '남양주4', '504C'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '1,3주', '월', '구리2', '905AB'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '1,3주', '화', '남양주4', '505AB'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '1,3주', '목', '남양주4', '502CD'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '1,3주', '금,토', '남양주3', '808BCD'),
  -- 2,4주차: 일(남4/504C), 목(남4/502CD), 금(구2/005AB), 토(남3/808BCD)
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '2,4주', '일', '남양주4', '504C'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '2,4주', '목', '남양주4', '502CD'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '2,4주', '금', '구리2', '005AB'),
  ((SELECT id FROM public.drivers WHERE name = '이경병' LIMIT 1), '2,4주', '토', '남양주3', '808BCD'),

  -- ----------------------------------------------------------------------------
  -- 5. 김소현 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 일(남4/504ABD), 월,화(남1/211CD), 수(남3/905AB), 금(구2/005AB)
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '1,3주', '일', '남양주4', '504ABD'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '1,3주', '월,화', '남양주1', '211CD'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '1,3주', '수', '남양주3', '905AB'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '1,3주', '금', '구리2', '005AB'),
  -- 2,4주차: 일(남4/504ABD), 월,화(남1/211CD), 수(남4/502CD), 토(구2/005AB)
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '2,4주', '일', '남양주4', '504ABD'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '2,4주', '월,화', '남양주1', '211CD'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '2,4주', '수', '남양주4', '502CD'),
  ((SELECT id FROM public.drivers WHERE name = '김소현' LIMIT 1), '2,4주', '토', '구리2', '005AB'),

  -- ----------------------------------------------------------------------------
  -- 6. 오지훈 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 일(구2/003통), 월(남4/508AB), 화(남3/905AB), 목(남4/605C), 금,토(남4/505CD)
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '1,3주', '일', '구리2', '003통'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '1,3주', '월', '남양주4', '508AB'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '1,3주', '화', '남양주3', '905AB'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '1,3주', '목', '남양주4', '605C'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '1,3주', '금,토', '남양주4', '505CD'),
  -- 2,4주차: 일,월(구2/003통), 화(남3/905AB), 금,토(남4/505CD)
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '2,4주', '일,월', '구리2', '003통'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '2,4주', '화', '남양주3', '905AB'),
  ((SELECT id FROM public.drivers WHERE name = '오지훈' LIMIT 1), '2,4주', '금,토', '남양주4', '505CD'),

  -- ----------------------------------------------------------------------------
  -- 7. 정승필 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 화(남2/515CD), 수(남2/517CD), 목,금(남2/519CD), 토(남2/518AB)
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '1,3주', '화', '남양주2', '515CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '1,3주', '수', '남양주2', '517CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '1,3주', '목,금', '남양주2', '519CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '1,3주', '토', '남양주2', '518AB'),
  -- 2,4주차: 월,화(남2/515CD), 수(남2/517CD), 목(남2/519CD), 금,토(남2/518AB)
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '2,4주', '월,화', '남양주2', '515CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '2,4주', '수', '남양주2', '517CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '2,4주', '목', '남양주2', '519CD'),
  ((SELECT id FROM public.drivers WHERE name = '정승필' LIMIT 1), '2,4주', '금,토', '남양주2', '518AB'),

  -- ----------------------------------------------------------------------------
  -- 8. 박현수 (백업)
  -- ----------------------------------------------------------------------------
  -- 1,3주차: 일,토(남2/517B), 화(남2/517CD), 금(남2/517A)
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '1,3주', '일,토', '남양주2', '517B'),
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '1,3주', '화', '남양주2', '517CD'),
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '1,3주', '금', '남양주2', '517A'),
  -- 2,4주차: 일(남2/517B), 월(구2/905AB), 화(구2/905BC), 금,토(남2/517A)
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '2,4주', '일', '남양주2', '517B'),
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '2,4주', '월', '구리2', '905AB'),
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '2,4주', '화', '구리2', '905BC'),
  ((SELECT id FROM public.drivers WHERE name = '박현수' LIMIT 1), '2,4주', '금,토', '남양주2', '517A');
