-- ============================================================
-- SIDEDOCK Migration v3 — Reviews
-- Supabase SQL Editor에 붙여넣기하여 실행
-- ============================================================

-- 1. reviews 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid        REFERENCES public.products(id)  ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES public.profiles(id)  ON DELETE CASCADE NOT NULL,
  rating      integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content     text        NOT NULL CHECK (length(content) >= 10),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (product_id, user_id)   -- 유저당 제품 리뷰 1개
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx    ON public.reviews(user_id);

-- 2. RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all"   ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth"  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own"   ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own"   ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);
