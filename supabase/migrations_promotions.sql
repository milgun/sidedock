-- 홈 상단 배너에 노출하는 홍보(해커톤·이벤트 등). 노출 기간 동안만 기본 환영 배너 대신 표시됩니다.
CREATE TABLE IF NOT EXISTS public.home_promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  badge text,
  title text NOT NULL,
  description text,
  cta_label text,
  cta_url text,
  image_url text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS home_promotions_active_idx
  ON public.home_promotions(ends_at DESC)
  WHERE is_enabled = true;

ALTER TABLE public.home_promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'home_promotions' AND policyname = 'home_promotions_read_enabled') THEN
    CREATE POLICY "home_promotions_read_enabled" ON public.home_promotions FOR SELECT USING (is_enabled = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'home_promotions' AND policyname = 'home_promotions_admin_all') THEN
    CREATE POLICY "home_promotions_admin_all" ON public.home_promotions FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- 첫 홍보: Korea Local Marketing Hackathon 2026 (한국시간 11월 16일 23:59까지)
INSERT INTO public.home_promotions (badge, title, description, cta_label, cta_url, starts_at, ends_at)
SELECT
  'HACK:ON · 11월 21일(토) · 참가비 없음',
  'Korea Local Marketing Hackathon 2026',
  '전국 장소·코스·사진을 모아 외국인 여행자를 위한 지도로 만드는 하루짜리 해커톤. 32팀 선발, 신청은 11월 16일(월)까지.',
  '참가 신청하기',
  'https://hackon.kr/e/002e1704',
  now(),
  '2026-11-16 23:59:00+09'
WHERE NOT EXISTS (SELECT 1 FROM public.home_promotions);
