/**
 * 제품 이름을 URL-friendly slug로 변환합니다.
 * 예: "ChatGPT Plus" → "chatgpt-plus"
 *     "AI 기반 메모 앱" → "ai-기반-메모-앱"
 */
export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")   // 영문자·숫자·한글·공백·하이픈만 허용
    .replace(/\s+/g, "-")             // 공백 → 하이픈
    .replace(/-+/g, "-")              // 연속 하이픈 정리
    .replace(/^-|-$/g, "");           // 앞뒤 하이픈 제거
}

/**
 * Supabase client를 이용해 slug 중복을 확인하고, 고유한 slug를 반환합니다.
 * 중복 시 "-2", "-3" ... 순서로 suffix를 붙입니다.
 */
export async function generateUniqueSlug(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  excludeId?: string,
  table: string = "products"
): Promise<string> {
  const base = toSlug(name) || "post";
  let candidate = base;
  let n = 2;

  while (true) {
    let query = supabase
      .from(table)
      .select("id")
      .eq("slug", candidate);

    if (excludeId) query = query.neq("id", excludeId);

    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    candidate = `${base}-${n}`;
    n++;
  }
}
