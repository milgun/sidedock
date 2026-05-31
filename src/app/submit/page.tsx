import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmitForm from "./SubmitForm";

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/submit");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">제품 등록</h1>
        <p className="mt-1 text-slate-500">AI 툴, SaaS, 사이드 프로젝트를 세상에 소개하세요.</p>
      </div>
      <SubmitForm username={username} />
    </div>
  );
}
