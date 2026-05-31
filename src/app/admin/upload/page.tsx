import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminUploadForm from "./AdminUploadForm";

export default async function AdminUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/upload");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  // Get pending review count for nav badge
  const { count: pendingCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Admin Nav */}
      <div className="mb-8 flex gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
          🛠 관리자 전용
        </span>
        <Link
          href="/admin/moderation"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          📋 심사 대기열
          {(pendingCount ?? 0) > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Hot Products 등록</h1>
        <p className="mt-1 text-slate-500">
          운영팀 큐레이션 제품을 등록합니다. <code className="rounded bg-slate-100 px-1 text-xs">source=curated</code>로 자동 설정됩니다.
        </p>
      </div>
      <AdminUploadForm />
    </div>
  );
}
