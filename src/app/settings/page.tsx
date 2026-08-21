import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-flex text-sm text-slate-400 hover:text-blue-600">← 홈으로 돌아가기</Link>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">설정</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sidedock 이용 환경과 계정을 관리합니다.</p>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:divide-navy-800 dark:border-navy-800 dark:bg-navy-900">
        <SettingLink href="/settings/notifications" icon="🔔" title="알림 설정" description="웹 알림과 이메일 수신 여부를 관리합니다." />
        <SettingLink href="/settings/theme" icon="🎨" title="화면 테마" description="라이트, 다크, 시스템 설정을 선택합니다." />
        <SettingLink href="/settings/security" icon="🔐" title="계정 및 보안" description={`로그인 이메일: ${user.email ?? "확인되지 않음"}`} />
      </div>
    </div>
  );
}

function SettingLink({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-5 transition hover:bg-slate-50 dark:hover:bg-navy-800">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-navy-800">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-900 dark:text-slate-100">{title}</span><span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span></span>
      <span className="text-lg text-slate-300 dark:text-slate-600">→</span>
    </Link>
  );
}
