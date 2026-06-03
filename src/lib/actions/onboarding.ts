"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = (formData.get("display_name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const websiteUrl = (formData.get("website_url") as string)?.trim() || null;
  const twitterUrl = (formData.get("twitter_url") as string)?.trim() || null;

  if (!displayName || !username) {
    return { error: "이름과 유저네임은 필수입니다." };
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "유저네임은 영문 소문자, 숫자, 밑줄(_)만 사용 가능하며 3~20자여야 합니다." };
  }

  // Check username uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) {
    return { error: "이미 사용 중인 유저네임입니다." };
  }

  const { error, count } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: displayName,
      username,
      bio,
      website_url: websiteUrl,
      twitter_url: twitterUrl,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      onboarding_completed: true,
    })
    .select();

  if (error) {
    console.error("[onboarding] update error:", error.message);
    return { error: "저장 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  console.log("[onboarding] updated rows:", count, "for user:", user.id);

  // JWT metadata 업데이트 → 미들웨어 리다이렉트 해제
  await supabase.auth.updateUser({ data: { onboarding_completed: true } });

  revalidatePath("/", "layout");
  redirect(`/profile/${username}`);
}
