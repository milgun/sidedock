-- ============================================================
-- SIDEDOCK v12 — 제품 소유권 클레임 (선등록/claim 흐름)
-- 운영팀이 선등록(source='curated')한 제품을 실제 메이커가
-- "소유권 요청"하면 관리자 승인 후 maker_id가 이전됩니다.
-- 실행: schema_full.sql → migrations_realtime.sql → migrations_claims.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_claims (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  claimant_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message       text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_at   timestamptz,
  reviewed_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS product_claims_product_id_idx ON public.product_claims(product_id);
CREATE INDEX IF NOT EXISTS product_claims_status_idx     ON public.product_claims(status, created_at);

-- 한 사용자가 같은 제품에 대기 중(pending) 클레임을 중복 생성하지 못하도록 방지
CREATE UNIQUE INDEX IF NOT EXISTS product_claims_unique_pending
  ON public.product_claims(product_id, claimant_id) WHERE status = 'pending';

ALTER TABLE public.product_claims ENABLE ROW LEVEL SECURITY;

-- 본인 클레임 또는 관리자만 조회
CREATE POLICY "product_claims_select" ON public.product_claims FOR SELECT USING (
  auth.uid() = claimant_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 로그인 사용자는 본인 명의로만 클레임 생성
CREATE POLICY "product_claims_insert" ON public.product_claims FOR INSERT WITH CHECK (
  auth.uid() = claimant_id
);

-- 승인/반려(상태 변경)는 관리자만
CREATE POLICY "product_claims_update_admin" ON public.product_claims FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
