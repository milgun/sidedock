"use client";

import { useState, useRef } from "react";
import { updateProfile, type UpdateProfileInput } from "@/lib/actions/profile";
import Image from "next/image";

type Profile = {
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  website_url: string | null;
  twitter_url: string | null;
  avatar_url: string | null;
  username: string;
};

export default function SettingsForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState<UpdateProfileInput>({
    display_name: profile.display_name ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    website_url: profile.website_url ?? "",
    twitter_url: profile.twitter_url ?? "",
    avatar_url: profile.avatar_url ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof UpdateProfileInput, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);

    if (!res.ok || json.error) {
      setError(json.error ?? "업로드에 실패했습니다.");
      return;
    }
    set("avatar_url", json.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateProfile(form);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  };

  const avatarSrc = form.avatar_url || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          프로필 사진
        </label>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 dark:bg-navy-800">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="avatar"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-slate-300">
                {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-navy-700 dark:text-slate-300"
            >
              {uploading ? "업로드 중..." : "사진 변경"}
            </button>
            {form.avatar_url && (
              <button
                type="button"
                onClick={() => set("avatar_url", "")}
                className="text-xs text-red-400 hover:text-red-600"
              >
                사진 제거
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        {/* Direct URL fallback */}
        <div className="mt-3">
          <input
            type="url"
            value={form.avatar_url}
            onChange={(e) => set("avatar_url", e.target.value)}
            placeholder="또는 이미지 URL 직접 입력 (https://...)"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Display name */}
      <Field
        label="표시 이름"
        hint="커뮤니티에 보여지는 이름입니다."
      >
        <input
          type="text"
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          maxLength={40}
          placeholder="이름을 입력하세요"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </Field>

      {/* Username (read-only) */}
      <Field
        label="사용자명"
        hint="고유 식별자입니다. 변경하려면 문의하세요."
      >
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-navy-700 dark:bg-navy-800">
          <span className="text-sm text-slate-400">@</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{profile.username}</span>
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-400 dark:bg-navy-700">변경 불가</span>
        </div>
      </Field>

      {/* Headline */}
      <Field
        label="헤드라인"
        hint="한 줄로 자신을 소개하세요 (예: Sidedock 창업자, AI 개발자)"
      >
        <input
          type="text"
          value={form.headline}
          onChange={(e) => set("headline", e.target.value)}
          maxLength={100}
          placeholder="예: froppy 창업자 · iOS 개발자"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </Field>

      {/* Bio */}
      <Field
        label="소개"
        hint="200자 이내로 자신을 소개해보세요."
      >
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={4}
          maxLength={200}
          placeholder="어떤 일을 하시나요? 어떤 것에 관심이 있으신가요?"
          className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
        <p className="mt-1 text-right text-xs text-slate-300">
          {form.bio.length} / 200
        </p>
      </Field>

      {/* Website */}
      <Field
        label="웹사이트"
        hint="포트폴리오나 블로그 주소"
      >
        <input
          type="url"
          value={form.website_url}
          onChange={(e) => set("website_url", e.target.value)}
          placeholder="https://yoursite.com"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </Field>

      {/* Twitter */}
      <Field
        label="Twitter / X"
        hint="트위터 또는 X 프로필 URL"
      >
        <input
          type="url"
          value={form.twitter_url}
          onChange={(e) => set("twitter_url", e.target.value)}
          placeholder="https://x.com/yourhandle"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </Field>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-blue-600"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">✓ 저장되었습니다</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}
