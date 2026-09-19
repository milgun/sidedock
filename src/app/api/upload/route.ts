import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// 원본 이미지 최대 변 길이 — Supabase Egress/Vercel Transformation 절감을 위해 업로드 시점에 리사이즈
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;
// UUID 파일명이라 내용이 바뀌지 않으므로 1년 장기 캐시 사용
const CACHE_CONTROL = "31536000";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "jpg, png, webp, gif 파일만 허용됩니다." },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "파일 크기는 5MB 이하여야 합니다." },
      { status: 400 }
    );
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // GIF(애니메이션)는 재인코딩하지 않고 원본 그대로 업로드, 그 외는 리사이즈 + WebP 재인코딩
  let outputBuffer = inputBuffer;
  let outputExt = ext;
  let outputContentType = file.type;
  if (ext !== "gif") {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    outputExt = "webp";
    outputContentType = "image/webp";
  }

  const filename = `${randomUUID()}.${outputExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, outputBuffer, {
      contentType: outputContentType,
      upsert: false,
      cacheControl: CACHE_CONTROL,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
