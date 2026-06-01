import { createClient, getUser } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileTabsClient from "@/components/profile/ProfileTabsClient";

export default async function ProfilePage(props: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await props.params;
  const { tab: initialTab = "about" } = await props.searchParams;

  const supabase = await createClient();

  const [{ data: profile }, user] = await Promise.all([
    supabase.from("profiles").select("*").eq("username", username).maybeSingle(),
    getUser(),
  ]);

  if (!profile) notFound();

  const isOwn = user?.id === profile.id;
  const userId = user?.id ?? null;

  const { count: publishedCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("maker_id", profile.id)
    .eq("status", "published");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* ── Profile Header ── */}
      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 ring-4 ring-blue-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url as string}
              alt={profile.display_name ?? username}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-black text-white">
              {((profile.display_name ?? username) as string)[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">
            {profile.display_name ?? username}
          </h1>
          <p className="text-sm text-slate-400">@{username}</p>
          {profile.bio && (
            <p className="mt-2 text-slate-600">{profile.bio as string}</p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-4 sm:justify-start">
            {profile.website_url && (
              <a
                href={profile.website_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                🌐 웹사이트
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                𝕏 Twitter
              </a>
            )}
          </div>
        </div>

        {isOwn && (
          <Link
            href="/settings"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
          >
            프로필 수정
          </Link>
        )}
      </div>

      {/* ── Tabs (client-side) ── */}
      <ProfileTabsClient
        username={username}
        isOwn={isOwn}
        userId={userId}
        initialTab={initialTab}
        publishedCount={publishedCount ?? 0}
        profileCreatedAt={profile.created_at as string}
        profileBio={(profile.bio as string) ?? null}
      />
    </div>
  );
}

