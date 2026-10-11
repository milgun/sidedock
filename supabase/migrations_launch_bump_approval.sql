UPDATE public.products
SET last_bumped_at = launched_at
WHERE source = 'launch'
  AND status = 'published'
  AND last_bumped_at IS NULL;

UPDATE public.products
SET last_bumped_at = NULL
WHERE source = 'launch'
  AND status <> 'published'
  AND launched_at <= created_at;