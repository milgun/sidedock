"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const BENEFITS = [
  { icon: "🚀", text: "내가 만든 제품을 세상에 런칭하고 싶어요." },
  { icon: "🔥", text: "주목받는 사이드 프로젝트를 발견하고 싶어요." },
  { icon: "💬", text: "메이커들과 피드백을 주고받고 싶어요." },
  { icon: "📝", text: "개발 과정을 Dev Log로 기록하고 싶어요." },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithKakao() {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "profile_nickname profile_image account_email",
        queryParams: { scope: "profile_nickname profile_image account_email" },
      },
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* 배경 — 흐릿한 그라디언트 오브 */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/30 blur-3xl" />

      {/* 카드 */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* 로고 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image src="/logo.svg" alt="Sidedock" width={28} height={30} className="h-7 w-auto" />
          <Image src="/logo-text.png" alt="Sidedock" width={100} height={24} className="h-5 w-auto" priority />
        </div>

        {/* 제목 */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-black text-slate-900">
            Build Something.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Launch Here.
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">만드는 사람들을 위한 런치패드.</p>
        </div>

        {/* 혜택 포인트 */}
        <ul className="mb-7 space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              <span className="text-base">{b.icon}</span>
              {b.text}
            </li>
          ))}
        </ul>

        {/* 로그인 버튼 */}
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
          >
            <GoogleIcon />
            <span className="flex-1 text-center">Google 계정으로 로그인</span>
          </button>

          <button
            onClick={signInWithKakao}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-3 text-sm font-semibold text-[#191919] shadow-sm transition hover:bg-[#F5DC00] hover:shadow-md active:scale-[0.98]"
          >
            <KakaoIcon />
            <span className="flex-1 text-center">카카오 계정으로 로그인</span>
          </button>
        </div>

        {/* 약관 */}
        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">이용약관</Link>
          {" "}과{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">개인정보처리방침</Link>
          에 동의합니다.
        </p>

        {/* 홈으로 */}
        <div className="mt-5 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-slate-400 transition hover:text-slate-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.696 5.08 4.27 6.47l-1.087 3.97a.25.25 0 0 0 .37.28l4.64-3.06A11.6 11.6 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="#191919" />
    </svg>
  );
}
