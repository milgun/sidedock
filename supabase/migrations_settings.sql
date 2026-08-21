-- 사용자별 이메일 알림 설정
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_comments boolean NOT NULL DEFAULT true,
  email_replies boolean NOT NULL DEFAULT true,
  email_upvotes boolean NOT NULL DEFAULT false,
  email_product_status boolean NOT NULL DEFAULT true,
  email_claims boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'notification_preferences_read_own') THEN
    CREATE POLICY "notification_preferences_read_own" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'notification_preferences_insert_own') THEN
    CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'notification_preferences_update_own') THEN
    CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Dev Log 댓글도 제품 댓글과 같은 답글/반응 기능을 사용합니다.
ALTER TABLE public.devlog_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.devlog_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS devlog_comments_parent_id_idx ON public.devlog_comments(parent_id);

CREATE TABLE IF NOT EXISTS public.devlog_comment_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.devlog_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('🚀','🔥','💡','❤️','✨','🥺')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS devlog_comment_reactions_comment_id_idx ON public.devlog_comment_reactions(comment_id);

ALTER TABLE public.devlog_comment_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devlog_comment_reactions' AND policyname = 'devlog_comment_reactions_read_auth') THEN
    CREATE POLICY "devlog_comment_reactions_read_auth" ON public.devlog_comment_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devlog_comment_reactions' AND policyname = 'devlog_comment_reactions_insert_own') THEN
    CREATE POLICY "devlog_comment_reactions_insert_own" ON public.devlog_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devlog_comment_reactions' AND policyname = 'devlog_comment_reactions_delete_own') THEN
    CREATE POLICY "devlog_comment_reactions_delete_own" ON public.devlog_comment_reactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;