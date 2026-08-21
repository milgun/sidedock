import { createClient, getUser } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/admin";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileTabsClient from "@/components/profile/ProfileTabsClient";
import BrandIcon from "@/components/product/BrandIcon";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

export async function generateMetadata(
  props: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await props.params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, headline, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return {};

  const name = (profile.display_name as string | null) ?? (profile.username as string);
  const description =
    (profile.headline as string | null) ??
    (profile.bio as string | null)?.slice(0, 160) ??
    `${name}님이 Sidedock에서 만든 AI 툴·SaaS·사이드 프로젝트를 확인하세요.`;
  const images = profile.avatar_url
    ? [{ url: profile.avatar_url as string, width: 400, height: 400 }]
    : [{ url: "/og-default.png", width: 1200, height: 630 }];

  return {
    title: `${name} (@${profile.username})`,
    description,
    alternates: { canonical: `/profile/${encodeURIComponent(profile.username as string)}` },
    openGraph: {
      title: `${name} (@${profile.username}) — Sidedock`,
      description,
      type: "profile",
      locale: "ko_KR",
      images,
    },
    twitter: {
      card: profile.avatar_url ? "summary" : "summary_large_image",
      title: `${name} (@${profile.username}) — Sidedock`,
      description,
      images: images.map((i) => i.url),
    },
  };
}

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
  const isAdmin = user ? await getIsAdmin() : false;

  const { count: publishedCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("maker_id", profile.id)
    .eq("status", "published");

  const displayName = (profile.display_name as string | null) ?? username;
  const sameAs = [profile.website_url, profile.twitter_url].filter(Boolean) as string[];
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${APP_URL}/profile/${encodeURIComponent(username)}`,
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "Person",
      name: displayName,
      alternateName: `@${username}`,
      ...(profile.headline ? { description: profile.headline as string } : {}),
      ...(profile.avatar_url ? { image: profile.avatar_url as string } : {}),
      url: `${APP_URL}/profile/${encodeURIComponent(username)}`,
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {profile.display_name ?? username}
          </h1>
          <p className="text-sm text-slate-400">@{username}</p>
          {profile.bio && (
            <p className="mt-2 text-slate-600 dark:text-slate-300">{profile.bio as string}</p>
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
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <BrandIcon type="x" className="h-3.5 w-3.5" />
                X(Twitter)
              </a>
            )}
          </div>
        </div>

        {isOwn && (
          <Link
            href="/settings/profile"
            className="rounded-xl border border-slate-200 dark:border-navy-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:border-blue-400 hover:text-blue-600"
          >
            프로필 수정
          </Link>
        )}
      </div>

      {/* ── Tabs (client-side) ── */}
      <ProfileTabsClient
        username={username}
        isOwn={isOwn}
        isAdmin={isAdmin}
        userId={userId}
        initialTab={initialTab}
        publishedCount={publishedCount ?? 0}
        profileCreatedAt={profile.created_at as string}
        profileBio={(profile.bio as string) ?? null}
      />
    </div>
  );
}

