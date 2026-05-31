"use client";

import { useState } from "react";
import { createCuratedProduct } from "@/lib/actions/product";

type FormFields = {
  name: string;
  tagline: string;
  url: string;
  category: string;
  description: string;
  tags: string;
  thumbnail_url: string;
  video_url: string;
  gallery_images: string[];
  is_featured: boolean;
  featured_label: string;
};

const CATEGORIES = [
  { value: "ai-tool",      label: "AI 툴" },
  { value: "saas",         label: "SaaS" },
  { value: "dev-tool",     label: "개발 툴" },
  { value: "productivity", label: "생산성" },
  { value: "design",       label: "디자인" },
  { value: "marketing",    label: "마케팅" },
  { value: "other",        label: "기타" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function AdminUploadForm() {
  const [form, setForm] = useState<FormFields>({
    name: "",
    tagline: "",
    url: "",
    category: "ai-tool",
    description: "",
    tags: "",
    thumbnail_url: "",
    video_url: "",
    gallery_images: [],
    is_featured: false,
    featured_label: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set =
    (key: keyof FormFields) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    const fd = new globalThis.FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) setUploadError(data.error ?? "업로드 실패");
      else setForm((f) => ({ ...f, thumbnail_url: data.url! }));
    } catch {
      setUploadError("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (form.gallery_images.length >= 8) return;
    setIsGalleryUploading(true);
    setGalleryUploadError(null);
    const fd = new globalThis.FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) setGalleryUploadError(data.error ?? "업로드 실패");
      else setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, data.url!] }));
    } catch {
      setGalleryUploadError("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsGalleryUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((f) => ({
      ...f,
      gallery_images: f.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setServerError(null);
    const result = await createCuratedProduct({
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      url: form.url,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url || undefined,
      gallery_images: form.gallery_images,
      is_featured: form.is_featured,
      featured_label: form.featured_label || undefined,
    });
    setIsSubmitting(false);
    if (result?.error) setServerError(result.error);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* 기본 정보 */}
      <Field label="제품 이름" required>
        <input
          type="text"
          value={form.name}
          onChange={set("name")}
          placeholder="예: Wrtn"
          maxLength={60}
          className={inputCls}
        />
      </Field>
      <Field label="한 줄 소개 (Tagline)" required>
        <input
          type="text"
          value={form.tagline}
          onChange={set("tagline")}
          placeholder="예: 모두를 위한 AI 글쓰기 도구"
          maxLength={80}
          className={inputCls}
        />
      </Field>
      <Field label="URL" required>
        <input
          type="url"
          value={form.url}
          onChange={set("url")}
          placeholder="https://wrtn.ai"
          className={inputCls}
        />
      </Field>
      <Field label="카테고리" required>
        <select value={form.category} onChange={set("category")} className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="제품 설명" required hint="어떤 문제를 해결하는지 자세히 소개하세요">
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={6}
          className={`${inputCls} resize-y`}
        />
      </Field>
      <Field label="태그" hint="쉼표로 구분 (예: ai, writing, productivity)">
        <input
          type="text"
          value={form.tags}
          onChange={set("tags")}
          placeholder="ai, saas, api"
          className={inputCls}
        />
      </Field>

      {/* 썸네일 업로드 */}
      <Field label="썸네일 이미지" hint="jpg, png, webp, gif · 최대 5MB">
        <label className="block cursor-pointer">
          <div className={`flex items-center gap-3 ${inputCls} cursor-pointer hover:border-blue-400`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-slate-500">
              {isUploading ? "업로드 중..." : form.thumbnail_url ? "다른 파일 선택" : "파일 선택"}
            </span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileUpload}
          />
        </label>
        {uploadError && <p className="mt-1.5 text-sm text-red-500">{uploadError}</p>}
        {form.thumbnail_url && (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.thumbnail_url} alt="preview" className="h-16 w-16 rounded-xl object-cover ring-1 ring-green-200" />
            <div>
              <p className="text-sm font-semibold text-green-700">✓ 업로드 완료</p>
              <button type="button" onClick={() => setForm((f) => ({ ...f, thumbnail_url: "" }))} className="mt-0.5 text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          </div>
        )}
      </Field>

      {/* 소개 영상 */}
      <Field label="소개 영상 (YouTube URL)" hint="유튜브 링크를 넣으면 제품 페이지 첫 슬라이드에 표시됩니다">
        <input
          type="url"
          value={form.video_url}
          onChange={set("video_url")}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputCls}
        />
      </Field>

      {/* 갤러리 이미지 */}
      <Field label="갤러리 이미지" hint="스크린샷 등 최대 8장 · jpg, png, webp · 최대 5MB">
        {form.gallery_images.length < 8 && (
          <label className="block cursor-pointer">
            <div className={`flex items-center gap-3 ${inputCls} cursor-pointer hover:border-blue-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-slate-500">
                {isGalleryUploading ? "업로드 중..." : `이미지 추가 (${form.gallery_images.length}/8)`}
              </span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={isGalleryUploading}
              onChange={handleGalleryUpload}
            />
          </label>
        )}
        {galleryUploadError && <p className="mt-1.5 text-sm text-red-500">{galleryUploadError}</p>}
        {form.gallery_images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {form.gallery_images.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`gallery ${i + 1}`} className="h-24 w-36 rounded-xl object-cover ring-1 ring-slate-200" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {/* 큐레이션 옵션 */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">큐레이션 설정</p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_featured"
            checked={form.is_featured}
            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <label htmlFor="is_featured" className="text-sm font-medium text-slate-700">
            에디터 픽 (홈 히어로 카드에 표시)
          </label>
        </div>
        {form.is_featured && (
          <Field label="배지 라벨" hint="예: Best AI Tool · 이번 주 추천">
            <input
              type="text"
              value={form.featured_label}
              onChange={set("featured_label")}
              placeholder="Best AI Tool"
              maxLength={40}
              className={inputCls}
            />
          </Field>
        )}
      </div>

      {serverError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !form.name || !form.tagline || !form.url || !form.description}
        className="w-full rounded-xl bg-navy-900 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
      >
        {isSubmitting ? "등록 중…" : "Hot Products에 등록하기 🔥"}
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-blue-500">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}
