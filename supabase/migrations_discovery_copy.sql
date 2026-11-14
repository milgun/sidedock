-- 오늘의 발견 소개 문구는 운영자만 작성하며, 제품별로 보관합니다.
CREATE TABLE IF NOT EXISTS public.product_discovery_copy (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  curiosity_text text NOT NULL CHECK (char_length(curiosity_text) <= 180 AND length(trim(curiosity_text)) > 0)
);

ALTER TABLE public.product_discovery_copy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discovery_copy_read_all" ON public.product_discovery_copy;
CREATE POLICY "discovery_copy_read_all" ON public.product_discovery_copy FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'published' AND is_discovery_pick = true)
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "discovery_copy_admin_write" ON public.product_discovery_copy;
CREATE POLICY "discovery_copy_admin_write" ON public.product_discovery_copy FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
