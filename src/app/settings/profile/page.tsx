import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsForm from "../SettingsForm";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, headline, bio, website_url, twitter_url, avatar_url")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href={`/profile/${profile.username}`} className="mb-4 inline-flex text-sm text-slate-400 hover:text-blue-600">← 내 프로필로 돌아가기</Link>
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">프로필 수정</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500 dark:text-slate-400">커뮤니티에 표시되는 정보를 수정합니다.</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <SettingsForm profile={{ ...profile, username: profile.username as string }} />
      </div>
    </div>
  );
}