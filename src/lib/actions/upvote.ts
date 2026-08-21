"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/emails/notification";

export async function toggleUpvote(
  productId: string
): Promise<{ success: boolean; hasUpvoted?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { data: existing } = await supabase
    .from("upvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false };
    return { success: true, hasUpvoted: false };
  } else {
    const { error } = await supabase
      .from("upvotes")
      .insert({ user_id: user.id, product_id: productId });
    if (error) return { success: false };

    // 업보트 알림 — 제품 제작자에게 (본인 제품 제외)
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

    if (product && product.maker_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: product.maker_id,
        type: "upvote",
        payload: {
          product_id: productId,
          product_name: product.name,
          actor_id: user.id,
          actor_username:
            actorProfile?.display_name ?? actorProfile?.username ?? "누군가",
        },
      });
      await sendNotificationEmail({
        userId: product.maker_id,
        type: "upvote",
        actorName: actorProfile?.display_name ?? actorProfile?.username ?? "누군가",
        productName: product.name,
        productHref: `/products/${productId}`,
      });
    }

    return { success: true, hasUpvoted: true };
  }
}
