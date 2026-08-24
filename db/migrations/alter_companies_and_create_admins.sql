-- ==============================================================================
-- 1. companies 테이블 개편 (user_id, password 제거 및 6자리 company_code 추가)
-- ==============================================================================

-- 1-1. company_code 컬럼 추가
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS company_code VARCHAR(6);

-- 1-2. 기존 회사 데이터에 6자리 랜덤 고유 코드 부여 (미설정 시)
UPDATE public.companies 
SET company_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE company_code IS NULL OR company_code = '';

-- 1-3. NOT NULL 및 UNIQUE 제약 조건 부여
ALTER TABLE public.companies 
  ALTER COLUMN company_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_company_code_unique'
  ) THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_company_code_unique UNIQUE (company_code);
  END IF;
END $$;

-- 1-4. 기존 user_id, password 컬럼 제거
ALTER TABLE public.companies 
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS password;


-- ==============================================================================
-- 2. 관리자 테이블 (admins) 생성
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admins (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  is_all_camps_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  can_create BOOLEAN NOT NULL DEFAULT TRUE,
  can_read BOOLEAN NOT NULL DEFAULT TRUE,
  can_update BOOLEAN NOT NULL DEFAULT TRUE,
  can_delete BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_admin_login_unique UNIQUE (company_id, login_id)
);

CREATE INDEX IF NOT EXISTS idx_admins_company_id ON public.admins(company_id);
CREATE INDEX IF NOT EXISTS idx_admins_login_id ON public.admins(login_id);


-- ==============================================================================
-- 3. 관리자별 담당 캠프 매핑 테이블 (admin_camps) 생성
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_camps (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  camp_id INT NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_camp_unique UNIQUE (admin_id, camp_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_camps_admin_id ON public.admin_camps(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_camps_camp_id ON public.admin_camps(camp_id);
