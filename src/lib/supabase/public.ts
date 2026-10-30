import { createClient } from "@supabase/supabase-js";

// 쿠키를 읽지 않는 익명 클라이언트 — 요청과 무관한 공개 데이터를 unstable_cache로 캐시할 때만 사용
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
