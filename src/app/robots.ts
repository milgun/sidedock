import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // 일반 검색엔진 크롤러
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/auth", "/settings", "/onboarding", "/notifications"],
      },
      {
        // 생성형 AI 크롤러 — GEO(Generative Engine Optimization) 대상
        userAgent: [
          "GPTBot", // OpenAI (ChatGPT)
          "OAI-SearchBot", // OpenAI 검색
          "ChatGPT-User", // ChatGPT 브라우징
          "ClaudeBot", // Anthropic (Claude) 학습
          "Claude-Web", // Anthropic 브라우징
          "anthropic-ai", // Anthropic
          "Google-Extended", // Google (Gemini) 학습
          "PerplexityBot", // Perplexity
          "Perplexity-User", // Perplexity 브라우징
          "Applebot-Extended", // Apple Intelligence
          "Bytespider", // ByteDance
          "CCBot", // Common Crawl (다수 LLM 학습 소스)
          "Amazonbot", // Amazon
        ],
        allow: "/",
        disallow: ["/admin", "/api", "/auth", "/settings", "/onboarding", "/notifications"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
