import { createClient } from "@/lib/supabase/server";
import AdminTabs from "./AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ count: pendingCount }, { count: claimCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("product_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 border-b border-slate-200 dark:border-navy-800">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white dark:bg-blue-600">
            관리자 설정
          </span>
        </div>
        <AdminTabs pendingCount={pendingCount ?? 0} claimCount={claimCount ?? 0} />
      </div>
      {children}
    </div>
  );
}