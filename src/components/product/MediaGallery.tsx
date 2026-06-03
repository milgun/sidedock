"use client";

import { useState } from "react";
import Image from "next/image";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

type MediaItem =
  | { type: "video"; url: string; youtubeId: string }
  | { type: "image"; url: string };

interface MediaGalleryProps {
  videoUrl: string | null;
  galleryImages: string[];
}

export default function MediaGallery({ videoUrl, galleryImages }: MediaGalleryProps) {
  const items: MediaItem[] = [];

  if (videoUrl) {
    const youtubeId = getYouTubeId(videoUrl);
    if (youtubeId) {
      items.push({ type: "video", url: videoUrl, youtubeId });
    }
  }

  for (const img of galleryImages) {
    if (img) items.push({ type: "image", url: img });
  }

  const [current, setCurrent] = useState(0);

  if (items.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);
  const next = () => setCurrent((c) => (c + 1) % items.length);

  const item = items[current];

  return (
    <section className="mb-10">
      {/* Main viewer */}
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-900"
        style={{ aspectRatio: "16 / 9" }}
      >
        {item.type === "video" ? (
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}`}
            title="소개 영상"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <Image
            src={item.url}
            alt={`소개 이미지 ${current + 1}`}
            fill
            className="object-contain"
            unoptimized
          />
        )}

        {/* Prev / Next */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="이전"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/70 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="다음"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/70 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators — below the viewer */}
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`슬라이드 ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? "w-6 h-2.5 bg-slate-700"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
