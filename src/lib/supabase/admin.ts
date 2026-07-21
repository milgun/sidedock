import { createClient } from "@supabase/supabase-js";

/**
 * service_role 키를 사용하는 서버 전용 관리자 클라이언트.
 * RLS를 우회하고 auth admin API(getUserById 등)에 접근할 수 있습니다.
 * 절대 클라이언트 컴포넌트나 브라우저로 노출하지 마세요.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
