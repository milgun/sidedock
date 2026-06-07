-- ============================================================
-- SIDEDOCK Realtime Publication Migrations (v9 ~ v10 통합)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
