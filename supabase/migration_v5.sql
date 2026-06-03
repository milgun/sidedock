-- migration_v5: profiles에 headline 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text;
