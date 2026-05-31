import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, display_name, username")
    .eq("id", user.id)
    .single();

  // 이미 온보딩 완료한 유저는 홈으로
  if (profile?.onboarding_completed) redirect("/");

  const defaultDisplayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    "";

  const defaultUsername = profile?.username ?? "";

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            SIDEDOCK에 오신 걸 환영합니다!
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            프로필을 완성하고 사이드 프로젝트를 공유해보세요.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <OnboardingForm
            defaultDisplayName={defaultDisplayName}
            defaultUsername={defaultUsername}
          />
        </div>
      </div>
    </main>
  );
}
