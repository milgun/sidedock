import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DiscoveryClient, { type DiscoveryProduct } from "./DiscoveryClient";

type Scope = "recent" | "all";

export default async function DiscoveryPage(props: { searchParams: Promise<{ scope?: string }> }) {
  const { scope: rawScope } = await props.searchParams;
  const scope: Scope = rawScope === "all" ? "all" : "recent";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  let query = supabase
    .from("products")
    .select("id, slug, name, tagline, thumbnail_url, created_at, is_discovery_pick, maker:profiles(id, username, display_name, avatar_url)")
    .eq("source", "launch")
    .eq("status", "published")
    .order("is_discovery_pick", { ascending: false })
    .order("launched_at", { ascending: false });

  if (scope === "recent") query = query.limit(20);
  const { data } = await query;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">오늘의 발견</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">공개된 Launches 중 하나를 홈에서 소개합니다.</p>
      </div>
      <DiscoveryClient products={(data ?? []) as unknown as DiscoveryProduct[]} scope={scope} />
    </div>
  );
}