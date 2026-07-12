"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileInput {
  display_name: string;
  headline: string;
  bio: string;
  website_url: string;
  twitter_url: string;
  avatar_url: string;
  theme_preference: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ error?: string; username?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const website = input.website_url.trim();
  const twitter = input.twitter_url.trim();

  // Basic URL validation
  const urlRe = /^https?:\/\/.+/;
  if (website && !urlRe.test(website))
    return { error: "웹사이트 URL은 https:// 로 시작해야 합니다." };
  if (twitter && !urlRe.test(twitter))
    return { error: "Twitter URL은 https:// 로 시작해야 합니다." };

  const theme = ["light", "dark", "system"].includes(input.theme_preference)
    ? input.theme_preference
    : "system";

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name.trim() || null,
      headline: input.headline.trim() || null,
      bio: input.bio.trim() || null,
      website_url: website || null,
      twitter_url: twitter || null,
      avatar_url: input.avatar_url.trim() || null,
      theme_preference: theme,
    })
    .eq("id", user.id)
    .select("username")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/profile/${data.username}`);
  revalidatePath("/settings");

  return { username: data.username as string };
}
