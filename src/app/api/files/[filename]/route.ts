/**
 * @deprecated 이 라우트는 Supabase Storage 전환 전 로컬 개발 전용이었습니다.
 * 신규 업로드는 모두 Supabase Storage를 통해 CDN URL로 반환됩니다.
 * 이 라우트는 구버전 데이터 호환성을 위해 유지됩니다 (운영 환경에서는 도달 불가).
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "D:\\files";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // 경로 탐색 공격 방지
  if (/[/\\]|\.\./.test(filename)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  try {
    const buffer = await readFile(join(UPLOAD_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
