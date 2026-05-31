"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDevlogPost(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string) ?? "";

  if (!title || !content) return { error: "제목과 내용을 입력해주세요." };
  if (title.length < 5) return { error: "제목은 5자 이상 입력해주세요." };
  if (content.length < 20) return { error: "내용은 20자 이상 입력해주세요." };

  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);

  const { data, error } = await supabase
    .from("devlog_posts")
    .insert({ author_id: user.id, title, content, tags })
    .select("id")
    .single();

  if (error) return { error: error.message };

  redirect(`/devlog/${data.id}`);
}

export async function toggleDevlogLike(postId: string): Promise<{ success: boolean; hasLiked?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: existing } = await supabase
    .from("devlog_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("devlog_likes").delete().eq("id", existing.id);
    revalidatePath(`/devlog/${postId}`);
    return { success: true, hasLiked: false };
  } else {
    await supabase.from("devlog_likes").insert({ user_id: user.id, post_id: postId });
    revalidatePath(`/devlog/${postId}`);
    return { success: true, hasLiked: true };
  }
}

export async function createDevlogComment(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const postId = formData.get("post_id") as string;
  const content = (formData.get("content") as string)?.trim();
  if (!content || content.length < 2) return { error: "댓글 내용을 입력해주세요." };

  const { error } = await supabase
    .from("devlog_comments")
    .insert({ author_id: user.id, post_id: postId, content });

  if (error) return { error: error.message };

  revalidatePath(`/devlog/${postId}`);
  return {};
}