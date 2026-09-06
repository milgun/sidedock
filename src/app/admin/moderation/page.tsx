import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ModerationClient from "./ModerationClient";

export default async function ModerationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: pending } = await supabase
    .from("products")
    .select("id, slug, name, tagline, description, url, thumbnail_url, category, categories, created_at, maker:profiles(id, username, display_name, avatar_url)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  const products = (pending ?? []) as unknown as Parameters<typeof ModerationClient>[0]["products"];
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            제품 심사 대기열
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            제출된 제품을 검토하고 승인 또는 반려하세요.
          </p>
        </div>
        <span className={`ml-auto flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black ${
          products.length > 0
            ? "animate-pulse bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700"
        }`}>
          {products.length}
        </span>
      </div>

      {/* Checklist */}
      <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-navy-800 dark:bg-navy-800/50">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">심사 기준</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            "진짜 제품인가?",
            "실제 사용 가능한가?",
            "퀄리티가 있는가?",
            "AI 스팸 아닌가?",
            "기존 제품 복붙 아닌가?",
            "커뮤니티 가치가 있는가?",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-slate-300">□</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <ModerationClient products={products} />
    </div>
  );
}
