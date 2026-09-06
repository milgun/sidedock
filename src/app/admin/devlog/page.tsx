import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeDevlogClient, { type HomeDevlog } from "./HomeDevlogClient";

type Scope = "recent" | "all";

export default async function AdminDevlogPage(props: { searchParams: Promise<{ scope?: string }> }) {
  const { scope: rawScope } = await props.searchParams;
  const scope: Scope = rawScope === "all" ? "all" : "recent";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  let query = supabase
    .from("devlog_posts")
    .select("id, slug, title, created_at, is_home_featured, home_featured_at, author:profiles(username, display_name)")
    .order("is_home_featured", { ascending: false })
    .order("home_featured_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (scope === "recent") query = query.limit(20);
  const { data: posts } = await query;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">홈 Dev Log</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">홈 오른쪽에 표시할 기록을 최대 3편까지 선택합니다. 선택하지 않으면 최신 글 3편이 표시됩니다.</p>
      </div>
      <HomeDevlogClient posts={(posts ?? []) as unknown as HomeDevlog[]} scope={scope} />
    </div>
  );
}