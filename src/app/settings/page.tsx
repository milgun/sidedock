import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, headline, bio, website_url, twitter_url, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/profile/${profile.username}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
        >
          ← 내 프로필로 돌아가기
        </Link>
        <h1 className="text-2xl font-black text-slate-900">프로필 설정</h1>
        <p className="mt-1 text-sm text-slate-500">
          커뮤니티에 표시되는 정보를 수정합니다.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <SettingsForm
          profile={{
            username: profile.username as string,
            display_name: profile.display_name as string | null,
            headline: profile.headline as string | null,
            bio: profile.bio as string | null,
            website_url: profile.website_url as string | null,
            twitter_url: profile.twitter_url as string | null,
            avatar_url: profile.avatar_url as string | null,
          }}
        />
      </div>
    </div>
  );
}
