-- ============================================================
-- SIDEDOCK Complete Schema (schema.sql + v2 ~ v12 전체 통합)
-- 신규 환경 세팅 시 이 파일 하나만 실행하면 됩니다.
-- ============================================================

-- ── 1. profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username     text UNIQUE NOT NULL,
  display_name text,
  avatar_url   text,
  bio          text,
  website_url  text,
  twitter_url  text,
  headline     text,           -- v5
  is_admin     boolean DEFAULT false NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 2. products ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM (
    'ai-tool', 'saas', 'dev-tool', 'productivity', 'design', 'marketing', 'other',
    'mobile-app', 'browser-extension', 'desktop-app', 'game', 'api',
    'education', 'finance', 'health', 'social', 'ecommerce', 'media'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.products (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text NOT NULL,
  tagline          text NOT NULL,
  description      text NOT NULL,
  url              text NOT NULL,
  thumbnail_url    text,
  video_url        text,
  gallery_images   text[] DEFAULT '{}',
  category         product_category NOT NULL DEFAULT 'other',
  categories       text[] DEFAULT '{}',          -- v2
  tags             text[] DEFAULT '{}',
  is_open_source   boolean DEFAULT false NOT NULL, -- v2
  repo_url         text,                           -- v2
  maker_type       text DEFAULT 'maker' NOT NULL   -- v2
    CHECK (maker_type IN ('maker', 'hunter')),
  maker_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  upvote_count     integer DEFAULT 0 NOT NULL,
  comment_count    integer DEFAULT 0 NOT NULL,
  is_featured      boolean DEFAULT false NOT NULL,
  featured_label   text,
  source           text NOT NULL DEFAULT 'launch' CHECK (source IN ('curated', 'launch')),
  status           product_status NOT NULL DEFAULT 'draft',  -- v4
  rejection_reason text,                                     -- v4
  slug             text,                                     -- v8
  launched_at      timestamptz DEFAULT now() NOT NULL,
  created_at       timestamptz DEFAULT now() NOT NULL,
  search_vector    tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(tagline, '') || ' ' || COALESCE(description, ''))
  ) STORED
);

-- slug 백필 및 NOT NULL 설정
UPDATE public.products
SET slug = regexp_replace(lower(name), '[^a-z0-9가-힣]+', '-', 'g') || '-' || substring(id::text, 1, 6)
WHERE slug IS NULL;
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS products_search_idx           ON public.products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS products_launched_at_idx      ON public.products(launched_at DESC);
CREATE INDEX IF NOT EXISTS products_upvote_count_idx     ON public.products(upvote_count DESC);
CREATE INDEX IF NOT EXISTS products_is_featured_idx      ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS products_source_idx           ON public.products(source);
CREATE INDEX IF NOT EXISTS products_status_idx           ON public.products(status);
CREATE INDEX IF NOT EXISTS products_status_created_at_idx ON public.products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_maker_id_idx  ON public.products(maker_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx      ON public.products(slug);

-- ── 3. upvotes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.upvotes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE OR REPLACE FUNCTION public.handle_upvote_insert() RETURNS trigger AS $$
BEGIN UPDATE public.products SET upvote_count = upvote_count + 1 WHERE id = NEW.product_id; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_upvote_delete() RETURNS trigger AS $$
BEGIN UPDATE public.products SET upvote_count = upvote_count - 1 WHERE id = OLD.product_id; RETURN OLD; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_upvote_insert AFTER INSERT ON public.upvotes FOR EACH ROW EXECUTE PROCEDURE public.handle_upvote_insert();
CREATE OR REPLACE TRIGGER on_upvote_delete AFTER DELETE ON public.upvotes FOR EACH ROW EXECUTE PROCEDURE public.handle_upvote_delete();

-- ── 4. comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  parent_id  uuid REFERENCES public.comments(id) ON DELETE CASCADE, -- v7
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_product_id_idx ON public.comments(product_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx  ON public.comments(parent_id);

CREATE OR REPLACE FUNCTION public.handle_comment_insert() RETURNS trigger AS $$
BEGIN UPDATE public.products SET comment_count = comment_count + 1 WHERE id = NEW.product_id; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_comment_delete() RETURNS trigger AS $$
BEGIN UPDATE public.products SET comment_count = comment_count - 1 WHERE id = OLD.product_id; RETURN OLD; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE PROCEDURE public.handle_comment_insert();
CREATE OR REPLACE TRIGGER on_comment_delete AFTER DELETE ON public.comments FOR EACH ROW EXECUTE PROCEDURE public.handle_comment_delete();

-- ── 5. saved_products ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_products (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- ── 6. product_links / team_members / shoutouts / investor_info (v2) ──
CREATE TABLE IF NOT EXISTS public.product_links (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  link_type  text NOT NULL CHECK (link_type IN ('app-store','google-play','steam','github','bitbucket','gitlab','discord','other')),
  url        text NOT NULL,
  label      text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS product_links_product_id_idx ON public.product_links(product_id);

CREATE TABLE IF NOT EXISTS public.product_team_members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name       text NOT NULL,
  role       text DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS product_team_product_id_idx ON public.product_team_members(product_id);

CREATE TABLE IF NOT EXISTS public.product_shoutouts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  shoutout_name text NOT NULL,
  shoutout_url  text,
  reason_text   text NOT NULL,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS product_shoutouts_product_id_idx ON public.product_shoutouts(product_id);

CREATE TABLE IF NOT EXISTS public.product_investor_info (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id       uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  founder_reason   text,
  idea_reason      text,
  competitors_text text,
  revenue_info     text,
  other_info       text,
  created_at       timestamptz DEFAULT now() NOT NULL
);

-- ── 7. reviews (v3) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content    text NOT NULL CHECK (length(content) >= 10),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(product_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx    ON public.reviews(user_id);

-- ── 8. notifications (v4) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type       text NOT NULL,
  payload    jsonb DEFAULT '{}'::jsonb NOT NULL,
  read_at    timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx     ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- ── 9. devlog_posts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devlog_posts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title         text NOT NULL,
  content       text NOT NULL,
  tags          text[] DEFAULT '{}',
  thumbnail_url text,              -- v6
  slug          text,              -- v8
  like_count    integer DEFAULT 0 NOT NULL,
  comment_count integer DEFAULT 0 NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, ''))
  ) STORED
);

UPDATE public.devlog_posts
SET slug = regexp_replace(lower(title), '[^a-z0-9가-힣]+', '-', 'g') || '-' || substring(id::text, 1, 6)
WHERE slug IS NULL;
ALTER TABLE public.devlog_posts ALTER COLUMN slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS devlog_posts_author_idx    ON public.devlog_posts(author_id);
CREATE INDEX IF NOT EXISTS devlog_posts_created_at_idx ON public.devlog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS devlog_posts_search_idx    ON public.devlog_posts USING gin(search_vector);
CREATE UNIQUE INDEX IF NOT EXISTS devlog_posts_slug_idx ON public.devlog_posts(slug);

-- ── 10. devlog_likes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devlog_likes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    uuid REFERENCES public.devlog_posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

CREATE OR REPLACE FUNCTION public.handle_devlog_like_insert() RETURNS trigger AS $$
BEGIN UPDATE public.devlog_posts SET like_count = like_count + 1 WHERE id = NEW.post_id; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_devlog_like_delete() RETURNS trigger AS $$
BEGIN UPDATE public.devlog_posts SET like_count = like_count - 1 WHERE id = OLD.post_id; RETURN OLD; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_devlog_like_insert AFTER INSERT ON public.devlog_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_devlog_like_insert();
CREATE OR REPLACE TRIGGER on_devlog_like_delete AFTER DELETE ON public.devlog_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_devlog_like_delete();

-- ── 11. devlog_comments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devlog_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    uuid REFERENCES public.devlog_posts(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS devlog_comments_post_id_idx ON public.devlog_comments(post_id);

CREATE OR REPLACE FUNCTION public.handle_devlog_comment_insert() RETURNS trigger AS $$
BEGIN UPDATE public.devlog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_devlog_comment_delete() RETURNS trigger AS $$
BEGIN UPDATE public.devlog_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id; RETURN OLD; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_devlog_comment_insert AFTER INSERT ON public.devlog_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_devlog_comment_insert();
CREATE OR REPLACE TRIGGER on_devlog_comment_delete AFTER DELETE ON public.devlog_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_devlog_comment_delete();

-- ── 12. comment_reactions (v7) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji      text NOT NULL CHECK (emoji IN ('🚀','🔥','💡','❤️','✨','🥺')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS comment_reactions_comment_id_idx ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS comment_reactions_user_id_idx    ON public.comment_reactions(user_id);

-- ── 13. product_claims (v12) ────────────────────────────
-- 선등록(source='curated' 또는 maker_type='hunter') 제품을 실제 메이커가
-- "소유권 요청"하면 관리자 승인 후 maker_id가 이전됩니다.
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

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_shoutouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_investor_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlog_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlog_likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlog_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_claims       ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_read_all"    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- products (v4: read_all → read_published_or_own)
CREATE POLICY "products_read_published_or_own" ON public.products FOR SELECT USING (
  status = 'published' OR auth.uid() = maker_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "products_insert_auth"  ON public.products FOR INSERT WITH CHECK (auth.uid() = maker_id);
CREATE POLICY "products_update_own"   ON public.products FOR UPDATE USING (auth.uid() = maker_id);
CREATE POLICY "products_delete_own"   ON public.products FOR DELETE USING (auth.uid() = maker_id);
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- upvotes
CREATE POLICY "upvotes_read_all"      ON public.upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_insert_auth"   ON public.upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upvotes_delete_own"    ON public.upvotes FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "comments_read_all"     ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth"  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own"   ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); -- v11
CREATE POLICY "comments_delete_own"   ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- saved_products
CREATE POLICY "saved_read_own"        ON public.saved_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_insert_auth"     ON public.saved_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete_own"      ON public.saved_products FOR DELETE USING (auth.uid() = user_id);

-- product_links
CREATE POLICY "product_links_read_all"     ON public.product_links FOR SELECT USING (true);
CREATE POLICY "product_links_insert_maker" ON public.product_links FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_links_delete_maker" ON public.product_links FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_team_members
CREATE POLICY "product_team_read_all"     ON public.product_team_members FOR SELECT USING (true);
CREATE POLICY "product_team_insert_maker" ON public.product_team_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_team_delete_maker" ON public.product_team_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_shoutouts
CREATE POLICY "product_shoutouts_read_all"     ON public.product_shoutouts FOR SELECT USING (true);
CREATE POLICY "product_shoutouts_insert_maker" ON public.product_shoutouts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "product_shoutouts_delete_maker" ON public.product_shoutouts FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- product_investor_info
CREATE POLICY "investor_info_select" ON public.product_investor_info FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "investor_info_insert" ON public.product_investor_info FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));
CREATE POLICY "investor_info_update" ON public.product_investor_info FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND maker_id = auth.uid()));

-- reviews
CREATE POLICY "reviews_select_all"  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own"  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own"  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "notifications_read_own"    ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own"  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- devlog_posts
CREATE POLICY "devlog_posts_read_all"    ON public.devlog_posts FOR SELECT USING (true);
CREATE POLICY "devlog_posts_insert_auth" ON public.devlog_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "devlog_posts_update_own"  ON public.devlog_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "devlog_posts_delete_own"  ON public.devlog_posts FOR DELETE USING (auth.uid() = author_id);

-- devlog_likes
CREATE POLICY "devlog_likes_read_all"    ON public.devlog_likes FOR SELECT USING (true);
CREATE POLICY "devlog_likes_insert_auth" ON public.devlog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "devlog_likes_delete_own"  ON public.devlog_likes FOR DELETE USING (auth.uid() = user_id);

-- devlog_comments
CREATE POLICY "devlog_comments_read_all"    ON public.devlog_comments FOR SELECT USING (true);
CREATE POLICY "devlog_comments_insert_auth" ON public.devlog_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "devlog_comments_delete_own"  ON public.devlog_comments FOR DELETE USING (auth.uid() = author_id);

-- comment_reactions
CREATE POLICY "reactions_read_all"    ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own"  ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- product_claims (v12)
CREATE POLICY "product_claims_select" ON public.product_claims FOR SELECT USING (
  auth.uid() = claimant_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "product_claims_insert" ON public.product_claims FOR INSERT WITH CHECK (auth.uid() = claimant_id);
CREATE POLICY "product_claims_update_admin" ON public.product_claims FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ── Realtime publication (v9 ~ v10) ──────────────────────
-- 이미 추가된 테이블이면 오류가 날 수 있으나 무시해도 됩니다.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
