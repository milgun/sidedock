"use client";

import { useState } from "react";
import { createCuratedProduct, updateCuratedProduct } from "@/lib/actions/product";

type LinkItem = { id: string; type: string; url: string; label: string };

type FormFields = {
  name: string;
  tagline: string;
  url: string;
  categories: string[];
  description: string;
  tags: string;
  thumbnail_url: string;
  video_url: string;
  gallery_images: string[];
  extra_links: LinkItem[];
  maker_type: "maker" | "hunter";
  is_featured: boolean;
  featured_label: string;
};

export type AdminUploadInitialData = {
  name: string;
  tagline: string;
  url: string;
  categories: string[];
  description: string;
  tags: string[];
  thumbnail_url: string;
  video_url: string;
  gallery_images: string[];
  extra_links: LinkItem[];
  maker_type: "maker" | "hunter";
  is_featured: boolean;
  featured_label: string;
};

type Props = {
  productId?: string;
  initialData?: AdminUploadInitialData;
};

const ALL_CATEGORIES = [
  { value: "ai-tool",           label: "AI 툴",        icon: "🤖" },
  { value: "saas",              label: "SaaS",          icon: "☁️" },
  { value: "dev-tool",          label: "개발 툴",       icon: "🛠️" },
  { value: "productivity",      label: "생산성",        icon: "⚡" },
  { value: "design",            label: "디자인",        icon: "🎨" },
  { value: "marketing",         label: "마케팅",        icon: "📈" },
  { value: "mobile-app",        label: "모바일 앱",     icon: "📱" },
  { value: "browser-extension", label: "브라우저 확장", icon: "🧩" },
  { value: "desktop-app",       label: "데스크탑 앱",   icon: "🖥️" },
  { value: "game",              label: "게임",          icon: "🎮" },
  { value: "api",               label: "API / 백엔드",  icon: "⚙️" },
  { value: "education",         label: "교육",          icon: "📚" },
  { value: "finance",           label: "금융 / 핀테크", icon: "💰" },
  { value: "health",            label: "헬스 / 웰니스", icon: "❤️" },
  { value: "social",            label: "소셜",          icon: "💬" },
  { value: "ecommerce",         label: "이커머스",      icon: "🛒" },
  { value: "media",             label: "미디어",        icon: "📺" },
  { value: "other",             label: "기타",          icon: "📦" },
];

const EXTRA_LINK_TYPES = [
  { value: "app-store",   label: "App Store (iOS)" },
  { value: "google-play", label: "Google Play" },
  { value: "steam",       label: "Steam" },
  { value: "github",      label: "GitHub" },
  { value: "bitbucket",   label: "Bitbucket" },
  { value: "gitlab",      label: "GitLab" },
  { value: "discord",     label: "Discord" },
  { value: "x",           label: "X (Twitter)" },
  { value: "youtube",     label: "YouTube" },
  { value: "instagram",   label: "Instagram" },
  { value: "other",       label: "기타" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500";

export default function AdminUploadForm({ productId, initialData }: Props = {}) {
  const isEditMode = !!productId;
  const [form, setForm] = useState<FormFields>(
    initialData
      ? {
          ...initialData,
          tags: initialData.tags.join(", "),
        }
      : {
    name: "",
    tagline: "",
    url: "",
    categories: [],
    description: "",
    tags: "",
    thumbnail_url: "",
    video_url: "",
    gallery_images: [],
    extra_links: [],
    maker_type: "hunter",
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

  const toggleCategory = (val: string) =>
    setForm((f) => {
      if (f.categories.includes(val)) return { ...f, categories: f.categories.filter((c) => c !== val) };
      if (f.categories.length >= 3) return f;
      return { ...f, categories: [...f.categories, val] };
    });

  const addLink = () =>
    setForm((f) => ({ ...f, extra_links: [...f.extra_links, { id: crypto.randomUUID(), type: "app-store", url: "", label: "" }] }));
  const removeLink = (id: string) =>
    setForm((f) => ({ ...f, extra_links: f.extra_links.filter((l) => l.id !== id) }));
  const updateLink = (id: string, field: keyof Omit<LinkItem, "id">, value: string) =>
    setForm((f) => ({ ...f, extra_links: f.extra_links.map((l) => (l.id === id ? { ...l, [field]: value } : l)) }));

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
    const input = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      url: form.url,
      category: form.categories[0] ?? "other",
      categories: form.categories.length > 0 ? form.categories : ["other"],
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url || undefined,
      gallery_images: form.gallery_images,
      extra_links: form.extra_links.filter((l) => l.url.trim()).map((l) => ({ type: l.type, url: l.url.trim(), label: l.label || undefined })),
      maker_type: form.maker_type,
      is_featured: form.is_featured,
      featured_label: form.featured_label || undefined,
    };
    const result = isEditMode
      ? await updateCuratedProduct(productId!, input)
      : await createCuratedProduct(input);
    setIsSubmitting(false);
    if (result?.error) setServerError(result.error);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
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

      {/* 추가 링크 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">추가 링크</label>
          <button type="button" onClick={addLink}
            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
            + 링크 추가
          </button>
        </div>
        {form.extra_links.length === 0 && (
          <p className="text-xs text-slate-400">App Store, Google Play, GitHub 등 추가 링크를 넣어보세요.</p>
        )}
        <div className="space-y-2">
          {form.extra_links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-navy-800 dark:bg-navy-800">
              <select value={link.type} onChange={(e) => updateLink(link.id, "type", e.target.value)}
                className="w-36 flex-shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100">
                {EXTRA_LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="url" value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)}
                placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500" />
              <button type="button" onClick={() => removeLink(link.id)} className="flex-shrink-0 text-slate-300 transition hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* 등록자 유형 */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">등록자 유형</label>
        <div className="flex gap-2">
          {(["hunter", "maker"] as const).map((type) => (
            <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, maker_type: type }))}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                form.maker_type === type ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-navy-700 dark:text-slate-300"
              }`}>
              {type === "hunter" ? "🔍 큐레이터 (Hunter)" : "🛠️ 메이커 (Maker)"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {form.maker_type === "hunter" ? "Hot Products 큐레이션 — 내가 직접 만든 제품이 아닙니다." : "내가 만든 제품 — Launches로 등록하는 걸 권장합니다."}
        </p>
      </div>
      <Field label="카테고리" required hint={`최대 3개 선택 (현재 ${form.categories.length}/3)`}>
        {form.categories.length === 3 && (
          <p className="mb-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs text-amber-600">최대 3개 선택됐습니다.</p>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const selected = form.categories.includes(cat.value);
            const disabled = !selected && form.categories.length >= 3;
            return (
              <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)} disabled={disabled}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left transition ${
                  selected ? "border-blue-400 bg-blue-50 font-semibold text-blue-700"
                    : disabled ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-navy-800 dark:bg-navy-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-800"
                }`}>
                <span className="text-sm leading-none">{cat.icon}</span>
                <span className="flex-1 text-xs leading-tight">{cat.label}</span>
                {selected && <span className="text-[10px] text-blue-500">✓</span>}
              </button>
            );
          })}
        </div>
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
        disabled={isSubmitting || !form.name || !form.tagline || !form.url || !form.description || form.categories.length === 0}
        className="w-full rounded-xl bg-navy-900 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40 dark:bg-blue-600"
      >
        {isSubmitting ? "저장 중…" : isEditMode ? "수정 저장하기 ✏️" : "Hot Products에 등록하기 🔥"}
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
      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-blue-500">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}
