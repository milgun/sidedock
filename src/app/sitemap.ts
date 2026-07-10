import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

// 매시간 재생성 (신규 런칭·데브로그 반영)
export const revalidate = 3600;

// 쿠키 없이 공개 데이터만 읽는 클라이언트 — 라우트를 정적 캐시 가능하게 유지
function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${APP_URL}/launches`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/hot`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/devlog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${APP_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/guidelines`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${APP_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = createPublicClient();

    const [{ data: products }, { data: devlogs }, { data: profiles }] = await Promise.all([
      supabase
        .from("products")
        .select("slug, created_at, thumbnail_url")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("devlog_posts")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profiles")
        .select("username, created_at")
        .limit(5000),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${APP_URL}/products/${encodeURIComponent(p.slug as string)}`,
      lastModified: new Date(p.created_at as string),
      changeFrequency: "weekly",
      priority: 0.8,
      ...(p.thumbnail_url ? { images: [p.thumbnail_url as string] } : {}),
    }));

    const devlogRoutes: MetadataRoute.Sitemap = (devlogs ?? []).map((d) => ({
      url: `${APP_URL}/devlog/${encodeURIComponent(d.slug as string)}`,
      lastModified: new Date(d.updated_at as string),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((u) => ({
      url: `${APP_URL}/profile/${encodeURIComponent(u.username as string)}`,
      lastModified: new Date(u.created_at as string),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...devlogRoutes, ...profileRoutes];
  } catch {
    // DB 조회 실패 시에도 정적 경로는 노출
    return staticRoutes;
  }
}
