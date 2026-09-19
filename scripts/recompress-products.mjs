// 기존 제품 thumbnail_url / gallery_images 를 리사이즈/압축해 같은 Storage 경로에 덮어씁니다.
// 파일명(경로)이 그대로 유지되므로 products 테이블은 전혀 수정하지 않습니다.
//
// 사용법:
//   node --env-file=.env.local scripts/recompress-products.mjs            (기본: dry-run, 업로드 없음)
//   node --env-file=.env.local scripts/recompress-products.mjs --apply    (실제 덮어쓰기 실행)

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const MAX_DIMENSION = 1600; // 갤러리/썸네일 표시 최대 폭 기준 (신규 업로드 로직과 동일)
const QUALITY = 80;
const SKIP_UNDER_BYTES = 150 * 1024; // 이미 150KB 미만이면 재처리 생략
const CACHE_CONTROL = "31536000";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

const ENCODERS = {
  jpg: (img) => img.jpeg({ quality: QUALITY }),
  jpeg: (img) => img.jpeg({ quality: QUALITY }),
  png: (img) => img.png({ quality: QUALITY }),
  webp: (img) => img.webp({ quality: QUALITY }),
};
const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// 같은 경로는 한 번만 처리하기 위한 캐시 (썸네일/갤러리에 같은 파일이 중복 참조될 수 있음)
const resultCache = new Map();

async function recompressPath(path) {
  if (resultCache.has(path)) return resultCache.get(path);

  const ext = path.split(".").pop()?.toLowerCase();
  if (!ENCODERS[ext]) {
    const result = { status: "skip-ext" };
    resultCache.set(path, result);
    return result;
  }

  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
  if (dlErr || !blob) {
    const result = { status: "fail-download", message: dlErr?.message };
    resultCache.set(path, result);
    return result;
  }

  const original = Buffer.from(await blob.arrayBuffer());
  if (original.length < SKIP_UNDER_BYTES) {
    const result = { status: "skip-small", before: original.length };
    resultCache.set(path, result);
    return result;
  }

  try {
    const resized = await ENCODERS[ext](
      sharp(original)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    ).toBuffer();

    if (APPLY) {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, resized, {
        contentType: CONTENT_TYPES[ext],
        upsert: true,
        cacheControl: CACHE_CONTROL,
      });
      if (upErr) {
        const result = { status: "fail-upload", message: upErr.message };
        resultCache.set(path, result);
        return result;
      }
    }

    const result = { status: "ok", before: original.length, after: resized.length };
    resultCache.set(path, result);
    return result;
  } catch (e) {
    const result = { status: "fail-process", message: e.message };
    resultCache.set(path, result);
    return result;
  }
}

async function main() {
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, thumbnail_url, gallery_images");

  if (error) {
    console.error("products 조회 실패:", error.message);
    process.exit(1);
  }

  console.log(`전체 products: ${rows.length}건`);
  console.log(APPLY ? "모드: 실제 적용(--apply)" : "모드: dry-run (업로드 없음, --apply로 실행)");

  let ok = 0, skipSmall = 0, skipExt = 0, fail = 0;
  let beforeTotal = 0, afterTotal = 0;

  for (const row of rows) {
    const urls = [
      ...(row.thumbnail_url ? [row.thumbnail_url] : []),
      ...(Array.isArray(row.gallery_images) ? row.gallery_images : []),
    ].filter((u) => u?.startsWith(PUBLIC_PREFIX));

    for (const url of urls) {
      const path = url.slice(PUBLIC_PREFIX.length).split("?")[0];
      const result = await recompressPath(path);

      if (result.status === "ok") {
        ok += 1;
        beforeTotal += result.before;
        afterTotal += result.after;
        console.log(
          `- [${APPLY ? "적용" : "예정"}] ${path}: ${(result.before / 1024).toFixed(0)}KB -> ${(result.after / 1024).toFixed(0)}KB`
        );
      } else if (result.status === "skip-small") {
        skipSmall += 1;
      } else if (result.status === "skip-ext") {
        skipExt += 1;
      } else if (result.status?.startsWith("fail")) {
        fail += 1;
        console.log(`- [실패:${result.status}] ${path} (${result.message})`);
      }
    }
  }

  console.log("\n=== 요약 ===");
  console.log(`처리(고유 파일): ${ok}건, 이미 작아서 건너뜀: ${skipSmall}건, 확장자 제외: ${skipExt}건, 실패: ${fail}건`);
  console.log(`용량: ${(beforeTotal / 1024 / 1024).toFixed(2)}MB -> ${(afterTotal / 1024 / 1024).toFixed(2)}MB`);
  if (!APPLY) {
    console.log("\ndry-run입니다. 실제로 덮어쓰려면 --apply 옵션을 붙여 다시 실행하세요.");
  }
}

main();
