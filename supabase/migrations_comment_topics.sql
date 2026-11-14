-- 선택한 댓글 작성 주제를 댓글에 표시합니다. 기존 댓글과 답글은 NULL로 유지됩니다.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS topic text CHECK (topic IN ('question', 'impression', 'idea'));
