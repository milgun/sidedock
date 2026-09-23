import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 시 next-server 트레이싱이 sharp/libvips 네이티브 바이너리를 기본적으로 제외하므로
  // /api/upload 함수 번들에 강제로 포함시켜 ERR_DLOPEN_FAILED(sharp linux-x64)를 방지
  outputFileTracingIncludes: {
    "/api/upload": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.kakaocdn.net",
      },
      {
        protocol: "http",
        hostname: "**.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
