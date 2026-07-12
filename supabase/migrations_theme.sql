-- v13 — 사용자별 테마 설정 (라이트/다크/시스템)
-- profiles 테이블에 theme_preference 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('light','dark','system'));
