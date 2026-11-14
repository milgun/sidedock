export const DISCOVERY_COPY_MAX_LENGTH = 180;

export function parseDiscoveryCopy(value: unknown): { value: string | null } | { error: string } {
  if (typeof value !== "string") return { error: "호기심 문구를 확인해주세요." };
  const trimmed = value.trim();
  if (trimmed.length > DISCOVERY_COPY_MAX_LENGTH) {
    return { error: `호기심 문구는 ${DISCOVERY_COPY_MAX_LENGTH}자 이내로 입력해주세요.` };
  }
  return { value: trimmed || null };
}

export function getDiscoveryIntro(copy: string | null, makerName: string): string {
  return copy?.trim() || `Sidedock이 발견한 ${makerName}의 새 서비스입니다.`;
}
