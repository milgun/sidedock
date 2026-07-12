"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * 로그인 사용자의 DB 테마 설정을 화면(next-themes)에 1회 동기화합니다.
 * (기기 간 일관성 — 다른 기기/브라우저에서 접속해도 계정 설정이 반영됩니다.)
 * 인증 호출은 하지 않고, Navbar가 이미 조회한 값을 prop으로 받습니다.
 */
export default function ThemeSync({ serverTheme }: { serverTheme: string | null }) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    if (serverTheme && ["light", "dark", "system"].includes(serverTheme)) {
      setTheme(serverTheme);
    }
  }, [serverTheme, setTheme]);

  return null;
}
