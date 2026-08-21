import { redirect } from "next/navigation";
import Link from "next/link";
import SecuritySettingsForm from "./SecuritySettingsForm";

export default async function SecuritySettingsPage() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/security");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/settings" className="mb-4 inline-flex text-sm text-slate-400 hover:text-blue-600">← 설정으로 돌아가기</Link>
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">계정 및 보안</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500 dark:text-slate-400">로그인 정보와 계정 상태를 관리합니다.</p>
      <SecuritySettingsForm email={user.email ?? ""} />
    </div>
  );
}