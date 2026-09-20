-- Dev Log 공개 범위와 선택적 Work Folder
CREATE TABLE IF NOT EXISTS public.devlog_folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 40),
  slug text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_id, slug)
);

ALTER TABLE public.devlog_posts
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private'));
ALTER TABLE public.devlog_posts
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.devlog_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS devlog_folders_owner_idx ON public.devlog_folders(owner_id, created_at);
CREATE INDEX IF NOT EXISTS devlog_posts_folder_idx ON public.devlog_posts(folder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS devlog_posts_public_idx ON public.devlog_posts(visibility, created_at DESC);

ALTER TABLE public.devlog_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "devlog_posts_read_all" ON public.devlog_posts;
CREATE POLICY "devlog_posts_read_public_or_own" ON public.devlog_posts FOR SELECT USING (
  visibility = 'public' OR auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "devlog_folders_read_public_or_own" ON public.devlog_folders FOR SELECT USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM public.devlog_posts WHERE folder_id = devlog_folders.id AND visibility = 'public')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "devlog_folders_insert_own" ON public.devlog_folders FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "devlog_folders_update_own" ON public.devlog_folders FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "devlog_folders_delete_own" ON public.devlog_folders FOR DELETE USING (auth.uid() = owner_id);