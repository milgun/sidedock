import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/actions/settings";
import NotificationSettingsForm from "./NotificationSettingsForm";

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/notifications");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/settings" className="mb-4 inline-flex text-sm text-slate-400 hover:text-blue-600">← 설정으로 돌아가기</Link>
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">알림 설정</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500 dark:text-slate-400">웹 알림은 유지되며, 이메일 수신만 선택할 수 있습니다.</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <NotificationSettingsForm initial={await getNotificationPreferences()} />
      </div>
    </div>
  );
}