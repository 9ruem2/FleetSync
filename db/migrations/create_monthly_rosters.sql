-- 신규 테이블: monthly_rosters (월별 근무표 마스터)
CREATE TABLE IF NOT EXISTS public.monthly_rosters (
  id BIGSERIAL PRIMARY KEY,
  target_month VARCHAR(7) NOT NULL, -- e.g. '2026-08'
  title VARCHAR(255) NOT NULL,       -- e.g. '2026년 8월 정기 배차표'
  memo TEXT,
  status VARCHAR(50) DEFAULT 'approved', -- 'draft', 'approved', 'archived'
  total_assignments INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 신규 테이블: monthly_roster_items (월별 근무표 일자별/노선별 상세 내역)
CREATE TABLE IF NOT EXISTS public.monthly_roster_items (
  id BIGSERIAL PRIMARY KEY,
  roster_id BIGINT REFERENCES public.monthly_rosters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  camp_name VARCHAR(100) NOT NULL,
  route_name VARCHAR(100) NOT NULL,
  route_key VARCHAR(150) NOT NULL,
  driver_id BIGINT,
  driver_name VARCHAR(100),
  contract_type VARCHAR(50),
  status VARCHAR(50) NOT NULL, -- '고정', '용차', '백업', '휴무'
  backup_driver_id BIGINT,
  backup_driver_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_rosters_target_month ON public.monthly_rosters(target_month);
CREATE INDEX IF NOT EXISTS idx_monthly_roster_items_roster_id ON public.monthly_roster_items(roster_id);
CREATE INDEX IF NOT EXISTS idx_monthly_roster_items_date ON public.monthly_roster_items(date);
CREATE INDEX IF NOT EXISTS idx_monthly_roster_items_driver_id ON public.monthly_roster_items(driver_id);
