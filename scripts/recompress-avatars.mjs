// 기존 프로필 아바타를 리사이즈/압축해 같은 Storage 경로에 덮어씁니다.
// 파일명(경로)이 그대로 유지되므로 profiles.avatar_url은 수정하지 않습니다.
//
// 사용법:
//   node --env-file=.env.local scripts/recompress-avatars.mjs            (기본: dry-run, 업로드 없음)
//   node --env-file=.env.local scripts/recompress-avatars.mjs --apply    (실제 덮어쓰기 실행)

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const MAX_DIMENSION = 400; // 아바타는 최대 표시 크기(80px)보다 넉넉히 여유
const QUALITY = 80;
const SKIP_UNDER_BYTES = 100 * 1024; // 이미 100KB 미만이면 재처리 생략
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

async function main() {
  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .not("avatar_url", "is", null);

  if (error) {
    console.error("profiles 조회 실패:", error.message);
    process.exit(1);
  }

  const targets = rows.filter((r) => r.avatar_url?.startsWith(PUBLIC_PREFIX));

  console.log(`전체 profiles: ${rows.length}건 / 우리 버킷 소유 아바타: ${targets.length}건`);
  console.log(APPLY ? "모드: 실제 적용(--apply)" : "모드: dry-run (업로드 없음, --apply로 실행)");

  let processed = 0;
  let skippedSmall = 0;
  let skippedExt = 0;
  let failed = 0;
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const row of targets) {
    const path = row.avatar_url.slice(PUBLIC_PREFIX.length).split("?")[0];
    const ext = path.split(".").pop()?.toLowerCase();

    if (!ENCODERS[ext]) {
      skippedExt += 1;
      console.log(`- [건너뜀:확장자] ${path}`);
      continue;
    }

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
    if (dlErr || !blob) {
      failed += 1;
      console.log(`- [실패:다운로드] ${path} (${dlErr?.message})`);
      continue;
    }

    const original = Buffer.from(await blob.arrayBuffer());
    if (original.length < SKIP_UNDER_BYTES) {
      skippedSmall += 1;
      continue;
    }

    try {
      const resized = await ENCODERS[ext](
        sharp(original)
          .rotate()
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      ).toBuffer();

      beforeTotal += original.length;
      afterTotal += resized.length;
      processed += 1;

      console.log(
        `- [${APPLY ? "적용" : "예정"}] ${path}: ${(original.length / 1024).toFixed(0)}KB -> ${(resized.length / 1024).toFixed(0)}KB`
      );

      if (APPLY) {
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, resized, {
          contentType: CONTENT_TYPES[ext],
          upsert: true,
          cacheControl: CACHE_CONTROL,
        });
        if (upErr) {
          failed += 1;
          console.log(`  -> [실패:업로드] ${upErr.message}`);
        }
      }
    } catch (e) {
      failed += 1;
      console.log(`- [실패:처리] ${path} (${e.message})`);
    }
  }

  console.log("\n=== 요약 ===");
  console.log(`처리 대상: ${processed}건, 이미 작아서 건너뜀: ${skippedSmall}건, 확장자 제외: ${skippedExt}건, 실패: ${failed}건`);
  console.log(`용량: ${(beforeTotal / 1024 / 1024).toFixed(2)}MB -> ${(afterTotal / 1024 / 1024).toFixed(2)}MB`);
  if (!APPLY) {
    console.log("\ndry-run입니다. 실제로 덮어쓰려면 --apply 옵션을 붙여 다시 실행하세요.");
  }
}

main();
