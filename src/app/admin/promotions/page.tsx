import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { HomePromotion } from "@/types";
import PromotionsClient from "./PromotionsClient";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  const { data } = await supabase.from("home_promotions").select("*").order("ends_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">홍보</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          노출 기간 동안 홈 상단 환영 배너 대신 홍보를 표시하고, 기간이 끝나면 Sidedock 소개 문구로 자동 복귀합니다. 기간이 겹치면 시작이 가장 늦은 홍보 하나만 표시됩니다.
        </p>
      </div>
      <PromotionsClient promotions={(data ?? []) as HomePromotion[]} />
    </div>
  );
}
