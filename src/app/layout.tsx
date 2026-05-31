import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Sidedock — AI·사이드 프로젝트 발견 플랫폼",
    template: "%s — Sidedock",
  },
  description: "AI 툴, SaaS, 사이드 프로젝트를 가장 먼저 발견하세요. 메이커들의 첫 런칭 무대.",
  openGraph: {
    title: "Sidedock — AI·사이드 프로젝트 발견 플랫폼",
    description: "AI 툴, SaaS, 사이드 프로젝트를 가장 먼저 발견하세요.",
    siteName: "Sidedock",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sidedock — AI·사이드 프로젝트 발견 플랫폼",
    description: "AI 툴, SaaS, 사이드 프로젝트를 가장 먼저 발견하세요.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 text-center">
          <p className="font-mono text-xs text-slate-400">
            © 2026 Sidedock &mdash; Build Something. Launch Here.
          </p>
          <div className="mt-2 flex justify-center gap-6">
            <Link href="/products" className="text-xs text-slate-400 hover:text-blue-600">제품 탐색</Link>
            <Link href="/submit" className="text-xs text-slate-400 hover:text-blue-600">제품 등록</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
