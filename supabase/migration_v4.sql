-- ============================================================
-- SIDEDOCK Migration v4 — 제품 심사 워크플로우 + 알림
-- Supabase SQL Editor에 붙여넣기하여 실행
-- ============================================================

-- 1. product_status enum 생성
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. products 테이블에 status, rejection_reason 컬럼 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. 기존 products → published (이미 공개된 제품들을 전부 published로 백필)
UPDATE public.products SET status = 'published' WHERE status = 'draft';

-- 4. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        text        NOT NULL,  -- 'product_submitted' | 'product_approved' | 'product_rejected'
  payload     jsonb       DEFAULT '{}'::jsonb NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx     ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- 5. notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own"    ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own"  ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
-- 서버에서 다른 유저에게 알림 생성 허용 (앱 로직에서 제어)
CREATE POLICY "notifications_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. products SELECT RLS 교체
--    published 제품은 전체 공개, 본인 제품과 관리자는 전체 status 열람 가능
DROP POLICY IF EXISTS "products_read_all" ON public.products;

CREATE POLICY "products_read_published_or_own" ON public.products
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = maker_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 7. 관리자가 다른 유저의 제품을 승인/반려할 수 있도록 UPDATE 정책 추가
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 8. 상태별 조회 인덱스
CREATE INDEX IF NOT EXISTS products_status_idx              ON public.products(status);
CREATE INDEX IF NOT EXISTS products_status_created_at_idx   ON public.products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_maker_id_idx     ON public.products(maker_id, status);
