-- migration_v6: devlog_posts에 thumbnail_url 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE public.devlog_posts
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- devlog_posts delete policy 추가 (없을 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'devlog_posts' AND policyname = 'devlog_posts_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY devlog_posts_delete_own ON public.devlog_posts FOR DELETE USING (auth.uid() = author_id)';
  END IF;
END;
$$;
