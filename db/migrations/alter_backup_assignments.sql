-- backup_assignments 테이블에 camp_name 및 updated_at 컬럼 추가 마이그레이션
ALTER TABLE public.backup_assignments 
  ADD COLUMN IF NOT EXISTS camp_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 기존 데이터의 updated_at이 NULL인 경우 created_at 값으로 채움
UPDATE public.backup_assignments 
SET updated_at = created_at 
WHERE updated_at IS NULL;
