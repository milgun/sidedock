-- migration_v7: 댓글 대댓글(replies) + 이모티콘 반응(reactions) 기능 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. comments 테이블에 parent_id 추가 (대댓글 지원)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);

-- 2. comment_reactions 테이블 생성
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('�','🔥','💡','❤️','✨','🥺')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS comment_reactions_comment_id_idx ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS comment_reactions_user_id_idx ON public.comment_reactions(user_id);

-- 3. RLS for comment_reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_read_all"   ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);
