ALTER TABLE public.devlog_posts
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS last_bumped_at timestamptz;

UPDATE public.products
SET last_bumped_at = launched_at
WHERE last_bumped_at IS NULL;

CREATE INDEX IF NOT EXISTS devlog_posts_product_idx
  ON public.devlog_posts(product_id, created_at DESC)
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS products_last_bumped_at_idx
  ON public.products(last_bumped_at DESC);