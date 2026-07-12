import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "알림",
};

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/notifications");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 읽지 않은 알림 일괄 처리
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-black text-slate-900 dark:text-slate-100">알림</h1>
      <NotificationsClient initialNotifications={data ?? []} />
    </div>
  );
}
