-- ============================================================
-- SIDEDOCK Migration v2 — Enhanced Launch Submission
-- Supabase SQL Editor에 붙여넣기하여 실행
-- ============================================================

-- 1. product_category enum 확장
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'mobile-app';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'browser-extension';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'desktop-app';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'game';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'api';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'education';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'health';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'social';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'ecommerce';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'media';

-- 2. products 테이블에 새 컬럼 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categories    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_open_source boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS repo_url       text,
  ADD COLUMN IF NOT EXISTS maker_type     text    DEFAULT 'maker' NOT NULL
    CHECK (maker_type IN ('maker', 'hunter'));

-- 3. product_links 테이블 (플랫폼별 추가 링크)
CREATE TABLE IF NOT EXISTS public.product_links (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  link_type  text NOT NULL
    CHECK (link_type IN ('app-store', 'google-play', 'steam', 'github', 'bitbucket', 'gitlab', 'other')),
  url        text NOT NULL,
  label      text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS product_links_product_id_idx ON public.product_links(product_id);

-- 4. product_team_members 테이블
CREATE TABLE IF NOT EXISTS public.product_team_members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name       text NOT NULL,
  role       text DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS product_team_product_id_idx ON public.product_team_members(product_id);

-- 5. product_shoutouts 테이블
CREATE TABLE IF NOT EXISTS public.product_shoutouts (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id     uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  shoutout_name  text NOT NULL,
  shoutout_url   text,
  reason_text    text NOT NULL,
  sort_order     integer DEFAULT 0,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS product_shoutouts_product_id_idx ON public.product_shoutouts(product_id);

-- 6. product_investor_info 테이블 (비공개 — 관리자/본인만 열람)
CREATE TABLE IF NOT EXISTS public.product_investor_info (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id        uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  founder_reason    text,
  idea_reason       text,
  competitors_text  text,
  revenue_info      text,
  other_info        text,
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.product_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_shoutouts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_investor_info  ENABLE ROW LEVEL SECURITY;

-- product_links: 누구나 읽기, maker만 쓰기/삭제
CREATE POLICY "product_links_read_all"     ON public.product_links FOR SELECT USING (true);
CREATE POLICY "product_links_insert_maker" ON public.product_links FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_links_delete_maker" ON public.product_links FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_team_members: 누구나 읽기, maker만 쓰기/삭제
CREATE POLICY "product_team_read_all"     ON public.product_team_members FOR SELECT USING (true);
CREATE POLICY "product_team_insert_maker" ON public.product_team_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_team_delete_maker" ON public.product_team_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_shoutouts: 누구나 읽기, maker만 쓰기/삭제
CREATE POLICY "product_shoutouts_read_all"     ON public.product_shoutouts FOR SELECT USING (true);
CREATE POLICY "product_shoutouts_insert_maker" ON public.product_shoutouts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_shoutouts_delete_maker" ON public.product_shoutouts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_investor_info: 본인 + 관리자만 읽기/쓰기
CREATE POLICY "investor_info_select" ON public.product_investor_info FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.products    WHERE id = product_id AND maker_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "investor_info_insert" ON public.product_investor_info FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "investor_info_update" ON public.product_investor_info FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
