import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  return (
    <div className="mx-auto max-w-2xl py-2">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Hot Products 등록</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          운영팀 큐레이션 제품을 등록합니다. <code className="rounded bg-slate-100 px-1 text-xs dark:bg-navy-800">source=curated</code>로 자동 설정됩니다.
        </p>
      </div>
      <AdminUploadForm />
    </div>
  );
}
