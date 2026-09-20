import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DevlogEditor from "./DevlogEditor";

export default async function NewDevlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/devlog/new");
  const { data: folders } = await supabase
    .from("devlog_folders")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">✍️ 새 Dev Log</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">마크다운으로 경험과 인사이트를 공유하세요.</p>
      </div>
      <DevlogEditor initialFolders={folders ?? []} />
    </div>
  );
}