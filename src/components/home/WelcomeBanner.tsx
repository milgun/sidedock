"use client";

import { useEffect, useState } from "react";

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("sidedock_welcome_dismissed")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem("sidedock_welcome_dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 px-8 py-10 shadow-xl">
      {/* decorative blobs */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 h-40 w-40 rounded-full opacity-10 blur-2xl"
        style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
      />

      {/* dismiss button */}
      <button
        onClick={dismiss}
        aria-label="닫기"
        className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          First 100 Makers
        </div>
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Sidedock에 오신 걸 환영합니다 👋
        </h2>
        <p className="mt-2 text-blue-200">
          AI 툴 · SaaS · 사이드프로젝트를 발견하고, 공유하고, 함께 성장하는 공간입니다.
        </p>
        <p className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Build Something.{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Launch Here.
          </span>
        </p>
      </div>
    </div>
  );
}
