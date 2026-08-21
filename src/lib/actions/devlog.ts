"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug } from "@/lib/slug";
import { sendNotificationEmail } from "@/lib/emails/notification";
import type { ReactionEmoji, DevlogComment, Profile } from "@/types";

export async function createDevlogPost(formData: FormData): Promise<{ error?: string; slug?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const thumbnail_url = (formData.get("thumbnail_url") as string) || null;

  if (!title || !content) return { error: "제목과 내용을 입력해주세요." };
  if (title.length < 5) return { error: "제목은 5자 이상 입력해주세요." };
  if (content.length < 20) return { error: "내용은 20자 이상 입력해주세요." };

  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);
  const slug = await generateUniqueSlug(title, supabase as never, undefined, "devlog_posts");

  const { data, error } = await supabase
    .from("devlog_posts")
    .insert({ author_id: user.id, title, content, tags, thumbnail_url, slug })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/devlog");
  return { slug: data.slug };
}

export async function updateDevlogPost(postId: string, formData: FormData): Promise<{ error?: string; slug?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const thumbnail_url = (formData.get("thumbnail_url") as string) || null;

  if (!title || !content) return { error: "제목과 내용을 입력해주세요." };
  if (title.length < 5) return { error: "제목은 5자 이상 입력해주세요." };
  if (content.length < 20) return { error: "내용은 20자 이상 입력해주세요." };

  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);
  const slug = await generateUniqueSlug(title, supabase as never, postId, "devlog_posts");

  const { error } = await supabase
    .from("devlog_posts")
    .update({ title, content, tags, thumbnail_url, slug, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/devlog/${slug}`);
  return { slug };
}

export async function deleteDevlogPost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("devlog_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/devlog");
  return {};
}

/** 프로필 탭 등 리다이렉트 없이 삭제할 때 사용 */
export async function deleteDevlogPostSilent(postId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("devlog_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/devlog");
  return { success: true };
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

export async function createDevlogComment(formData: FormData): Promise<{ error?: string; comment?: DevlogComment & { author: Profile } }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const postId = formData.get("post_id") as string;
  const parentId = (formData.get("parent_id") as string) || null;
  const content = (formData.get("content") as string)?.trim();
  if (!content || content.length < 2) return { error: "댓글 내용을 입력해주세요." };

  const { data: inserted, error } = await supabase
    .from("devlog_comments")
    .insert({ author_id: user.id, post_id: postId, content, parent_id: parentId })
    .select("*, author:profiles(*)")
    .single();

  if (error) return { error: error.message };

  const [{ data: post }, { data: actorProfile }] = await Promise.all([
    supabase
      .from("devlog_posts")
      .select("author_id, title, slug")
      .eq("id", postId)
      .single(),
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),
  ]);

  if (post && post.author_id !== user.id) {
    const actorName = actorProfile?.display_name ?? actorProfile?.username ?? "누군가";
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "devlog_comment",
      payload: {
        devlog_id: postId,
        devlog_slug: post.slug ?? postId,
        devlog_title: post.title,
        actor_id: user.id,
        actor_username: actorName,
        comment_preview: content.slice(0, 100),
      },
    });
    await sendNotificationEmail({
      userId: post.author_id,
      type: "devlog_comment",
      actorName,
      productName: post.title,
      productHref: `/devlog/${encodeURIComponent(post.slug ?? postId)}`,
      commentPreview: content.slice(0, 100),
    });
  }

  revalidatePath(`/devlog/${postId}`);
  return { comment: { ...(inserted as unknown as DevlogComment), reactions: [], replies: [] } as DevlogComment & { author: Profile } };
}

export async function updateDevlogComment(commentId: string, postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const trimmed = content.trim();
  if (!trimmed) return { error: "댓글 내용을 입력해주세요." };
  const { error } = await supabase.from("devlog_comments").update({ content: trimmed }).eq("id", commentId).eq("author_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/devlog/${postId}`);
  return {};
}

export async function deleteDevlogComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const { error } = await supabase.from("devlog_comments").delete().eq("id", commentId).eq("author_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/devlog/${postId}`);
  return {};
}

export async function toggleDevlogCommentReaction(commentId: string, postId: string, emoji: ReactionEmoji) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const { data: existing } = await supabase.from("devlog_comment_reactions").select("id").eq("comment_id", commentId).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();
  const result = existing
    ? await supabase.from("devlog_comment_reactions").delete().eq("id", existing.id)
    : await supabase.from("devlog_comment_reactions").insert({ comment_id: commentId, user_id: user.id, emoji });
  if (result.error) return { error: result.error.message };
  revalidatePath(`/devlog/${postId}`);
  return {};
}