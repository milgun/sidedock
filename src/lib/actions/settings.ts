"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type NotificationPreferences = {
  email_comments: boolean;
  email_replies: boolean;
  email_upvotes: boolean;
  email_product_status: boolean;
  email_claims: boolean;
};

const defaults: NotificationPreferences = {
  email_comments: true,
  email_replies: true,
  email_upvotes: false,
  email_product_status: true,
  email_claims: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return defaults;

  const { data } = await supabase
    .from("notification_preferences")
    .select("email_comments, email_replies, email_upvotes, email_product_status, email_claims")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? { ...defaults, ...data } : defaults;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    ...preferences,
    updated_at: new Date().toISOString(),
  });
  return error ? { error: error.message } : {};
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  return error ? { error: "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요." } : {};
}