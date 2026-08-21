"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReactionEmoji } from "@/types";
import { sendNotificationEmail } from "@/lib/emails/notification";

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const productId = formData.get("product_id") as string;
  const content = (formData.get("content") as string)?.trim();
  const parentId = (formData.get("parent_id") as string) || null;

  if (!content || !productId) return;

  await supabase.from("comments").insert({
    user_id: user.id,
    product_id: productId,
    content,
    parent_id: parentId,
  });

  // 알림 발송
  const [{ data: product }, { data: actorProfile }] = await Promise.all([
    supabase
      .from("products")
      .select("maker_id, name")
      .eq("id", productId)
      .single(),
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),
  ]);

  const actorName = actorProfile?.display_name ?? actorProfile?.username ?? "누군가";
  const notificationsToInsert: object[] = [];

  if (parentId) {
    // 대댓글: 원댓글 작성자에게 알림 (본인 제외)
    const { data: parentComment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", parentId)
      .single();

    if (parentComment && parentComment.user_id !== user.id) {
      notificationsToInsert.push({
        user_id: parentComment.user_id,
        type: "reply",
        payload: {
          product_id: productId,
          product_name: product?.name ?? "",
          actor_id: user.id,
          actor_username: actorName,
          comment_preview: content.slice(0, 100),
        },
      });
    }
  } else {
    // 최상위 댓글: 제품 제작자에게 알림 (본인 제외)
    if (product && product.maker_id !== user.id) {
      notificationsToInsert.push({
        user_id: product.maker_id,
        type: "comment",
        payload: {
          product_id: productId,
          product_name: product.name,
          actor_id: user.id,
          actor_username: actorName,
          comment_preview: content.slice(0, 100),
        },
      });
    }
  }

  if (notificationsToInsert.length > 0) {
    await supabase.from("notifications").insert(notificationsToInsert);
    await Promise.all(notificationsToInsert.map(async (notification) => {
      const item = notification as { user_id: string; type: "comment" | "reply"; payload: Record<string, string> };
      await sendNotificationEmail({
        userId: item.user_id,
        type: item.type,
        actorName,
        productName: item.payload.product_name,
        productHref: `/products/${item.payload.product_id}`,
        commentPreview: item.payload.comment_preview,
      });
    }));
  }

  revalidatePath(`/products/${productId}`);
}

export async function updateComment(
  commentId: string,
  productId: string,
  content: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "내용을 입력해주세요." };

  const { error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string, productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function toggleReaction(
  commentId: string,
  productId: string,
  emoji: ReactionEmoji
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("comment_reactions").insert({
      comment_id: commentId,
      user_id: user.id,
      emoji,
    });
  }

  revalidatePath(`/products/${productId}`);
}

