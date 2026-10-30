import { revalidatePath as nextRevalidatePath, updateTag } from "next/cache";

export const PUBLIC_CACHE_TAG = "public";
export const PUBLIC_CACHE_SECONDS = 60;

// 공개 목록·상세 캐시만 비운다 (경로 지정이 필요 없는 제품 상태 변경 등에 사용). Server Action 안에서만 호출해야 한다.
export function revalidatePublicData() {
  updateTag(PUBLIC_CACHE_TAG);
}

// 기존 revalidatePath 호출 지점을 그대로 쓰면서, 쓰기 작업 직후 공개 데이터 캐시도 함께 만료시킨다.
// Server Action 안에서만 호출해야 한다.
export function revalidatePath(path: string, type?: "page" | "layout") {
  nextRevalidatePath(path, type);
  revalidatePublicData();
}
