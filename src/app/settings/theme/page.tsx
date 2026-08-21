import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeSettingsForm from "./ThemeSettingsForm";

export default async function ThemeSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/theme");
  const { data: profile } = await supabase.from("profiles").select("theme_preference").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/settings" className="mb-4 inline-flex text-sm text-slate-400 hover:text-blue-600">← 설정으로 돌아가기</Link>
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">화면 테마</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500 dark:text-slate-400">모든 기기에서 사용할 화면 테마를 선택합니다.</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <ThemeSettingsForm initial={(profile?.theme_preference as string) ?? "system"} />
      </div>
    </div>
  );
}