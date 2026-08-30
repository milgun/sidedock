-- Launches 중 운영자가 선정하는 홈 "오늘의 발견" 제품
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_discovery_pick boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS discovery_picked_at timestamptz;

CREATE INDEX IF NOT EXISTS products_discovery_pick_idx
  ON public.products(discovery_picked_at DESC)
  WHERE is_discovery_pick = true;