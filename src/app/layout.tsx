import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

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
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "Sidedock",
      alternateName: "사이드독",
      url: APP_URL,
      logo: `${APP_URL}/apple-touch-icon.png`,
      description:
        "한국의 1인 개발자와 스타트업이 AI 툴·SaaS·사이드 프로젝트를 런칭하고 평가받고 홍보하는 프로덕트 발견 플랫폼.",
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "Sidedock",
      description:
        "AI 툴, SaaS, 사이드 프로젝트를 가장 먼저 발견하세요. 메이커들의 첫 런칭 무대.",
      inLanguage: "ko-KR",
      publisher: { "@id": `${APP_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${APP_URL}/products?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-surface text-slate-900 dark:bg-navy-950 dark:text-slate-100"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-8 text-center dark:border-navy-800 dark:bg-navy-900">
            <p className="font-mono text-xs text-slate-400">
              © 2026 Sidedock &mdash; Build Something. Launch Here.
            </p>
            <div className="mt-2 flex justify-center gap-6">
              <Link href="/terms" className="text-xs text-slate-400 hover:text-blue-600">이용약관</Link>
              <Link href="/privacy" className="text-xs text-slate-400 hover:text-blue-600">개인정보처리방침</Link>
            </div>
            <details className="mt-4 mx-auto max-w-sm">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 select-none">
                사업자 정보
              </summary>
              <div className="mt-2 text-left text-xs text-slate-400 leading-relaxed px-4 space-y-0.5">
                <p>대표자: 이현석</p>
                <p>사업자등록번호: 784-10-03216</p>
                <p>통신판매업 신고번호: 2026-세종아름-0102</p>
                <p>주소: 세종특별자치시 보람로 96</p>
                <p>대표번호: 043-907-5072</p>
                <p>고객센터 운영시간: 평일 10:00~17:00</p>
                <p>개인정보보호책임자: 이현석</p>
                <p>이메일: <a href="mailto:contact@sidedock.io" className="hover:text-blue-500">contact@sidedock.io</a></p>
              </div>
            </details>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
