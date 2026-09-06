import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClaimsClient, { type PendingClaim } from "./ClaimsClient";

export default async function ClaimsPage() {
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
    .from("product_claims")
    .select(
      "id, message, created_at, product:products(id, slug, name, tagline, url, thumbnail_url, maker:profiles(username, display_name)), claimant:profiles!claimant_id(id, username, display_name, avatar_url)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const claims = (pending ?? []) as unknown as PendingClaim[];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            소유권 요청 심사
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            선등록 제품의 실제 메이커가 소유권을 요청했습니다. 확인 후 승인하면
            제품 소유권이 이전됩니다.
          </p>
        </div>
        <span
          className={`ml-auto flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black ${
            claims.length > 0
              ? "animate-pulse bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {claims.length}
        </span>
      </div>

      <ClaimsClient claims={claims} />
    </div>
  );
}
