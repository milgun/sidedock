"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createReview({
  productId,
  rating,
  content,
}: {
  productId: string;
  rating: number;
  content: string;
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    content: content.trim(),
  });

  if (error) {
    if (error.code === "23505") return { error: "이미 이 제품에 리뷰를 작성하셨습니다." };
    return { error: "리뷰 등록에 실패했습니다." };
  }

  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function deleteReview(
  reviewId: string,
  productId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return { error: "삭제에 실패했습니다." };

  revalidatePath(`/products/${productId}`);
  return { success: true };
}
