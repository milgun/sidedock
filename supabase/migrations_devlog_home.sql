-- 관리자가 홈 사이드바에 노출할 Dev Log를 최대 3편 선택할 수 있도록 합니다.
ALTER TABLE public.devlog_posts
  ADD COLUMN IF NOT EXISTS is_home_featured boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS home_featured_at timestamptz;

CREATE INDEX IF NOT EXISTS devlog_posts_home_featured_idx
  ON public.devlog_posts(home_featured_at DESC)
  WHERE is_home_featured = true;

CREATE POLICY "devlog_posts_update_admin" ON public.devlog_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);