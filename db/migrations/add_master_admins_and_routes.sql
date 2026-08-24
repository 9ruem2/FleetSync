-- ==============================================================================
-- 1. companies 테이블에 master_admin_ids (총괄관리자 아이디 목록) 컬럼 추가
-- ==============================================================================
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS master_admin_ids TEXT;

-- ==============================================================================
-- 2. admins 테이블에 is_master (총괄관리자 여부) 컬럼 추가
-- ==============================================================================
ALTER TABLE public.admins 
  ADD COLUMN IF NOT EXISTS is_master BOOLEAN NOT NULL DEFAULT FALSE;

-- ==============================================================================
-- 3. admin_camp_routes (관리자별 담당 캠프 및 라우터 상세 매핑) 테이블 생성
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_camp_routes (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  camp_id INT NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  route_id INT REFERENCES public.routes(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_camp_routes_admin_id ON public.admin_camp_routes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_camp_routes_camp_id ON public.admin_camp_routes(camp_id);
