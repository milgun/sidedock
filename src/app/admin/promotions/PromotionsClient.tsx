"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePromotion, savePromotion, setPromotionEnabled, type PromotionInput } from "@/lib/actions/promotion";
import type { HomePromotion } from "@/types";

const KST_OFFSET_MS = 9 * 3_600_000;

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500";

function toKstInput(iso: string) {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 16);
}

function formatKst(iso: string) {
  return toKstInput(iso).replace("T", " ");
}

function emptyForm(nowMs: number): PromotionInput {
  return {
    badge: "",
    title: "",
    description: "",
    cta_label: "",
    cta_url: "",
    image_url: "",
    starts_at: toKstInput(new Date(nowMs).toISOString()),
    ends_at: toKstInput(new Date(nowMs + 7 * 24 * 3_600_000).toISOString()),
    is_enabled: true,
  };
}

function toForm(promotion: HomePromotion): PromotionInput {
  return {
    id: promotion.id,
    badge: promotion.badge ?? "",
    title: promotion.title,
    description: promotion.description ?? "",
    cta_label: promotion.cta_label ?? "",
    cta_url: promotion.cta_url ?? "",
    image_url: promotion.image_url ?? "",
    starts_at: toKstInput(promotion.starts_at),
    ends_at: toKstInput(promotion.ends_at),
    is_enabled: promotion.is_enabled,
  };
}

function getStatus(promotion: HomePromotion, nowMs: number) {
  if (!promotion.is_enabled) return { label: "비활성", cls: "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400" };
  if (new Date(promotion.ends_at).getTime() <= nowMs) return { label: "종료", cls: "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400" };
  if (new Date(promotion.starts_at).getTime() > nowMs) return { label: "예약", cls: "bg-amber-100 text-amber-700" };
  return { label: "노출 중", cls: "bg-green-100 text-green-700" };
}

export default function PromotionsClient({ promotions }: { promotions: HomePromotion[] }) {
  const router = useRouter();
  const [nowMs] = useState(() => Date.now());
  const [form, setForm] = useState<PromotionInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof PromotionInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => (current ? { ...current, [key]: event.target.value } : current));

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new globalThis.FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) setError(data.error ?? "업로드 실패");
      else setForm((current) => (current ? { ...current, image_url: data.url! } : current));
    } catch {
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const result = await savePromotion(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm(null);
    router.refresh();
  };

  const handleToggle = async (promotion: HomePromotion) => {
    setProcessing(promotion.id);
    setError(null);
    const result = await setPromotionEnabled(promotion.id, !promotion.is_enabled);
    setProcessing(null);
    if (result.error) setError(result.error);
    else router.refresh();
  };

  const handleDelete = async (promotion: HomePromotion) => {
    if (!window.confirm(`"${promotion.title}" 홍보를 삭제할까요?`)) return;
    setProcessing(promotion.id);
    setError(null);
    const result = await deletePromotion(promotion.id);
    setProcessing(null);
    if (result.error) setError(result.error);
    else router.refresh();
  };

  return (
    <section className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p>}

      {form ? (
        <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{form.id ? "홍보 수정" : "새 홍보"}</h2>
          <Field label="제목" required hint="예: Korea Local Marketing Hackathon 2026">
            <input value={form.title} onChange={set("title")} maxLength={80} required className={inputCls} />
          </Field>
          <Field label="상단 배지" hint="제목 위의 작은 문구 (선택)">
            <input value={form.badge} onChange={set("badge")} maxLength={60} placeholder="HACK:ON · 11월 21일(토) · 참가비 없음" className={inputCls} />
          </Field>
          <Field label="설명" hint="최대 200자 (선택)">
            <textarea value={form.description} onChange={set("description")} maxLength={200} rows={3} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="버튼 문구" hint="비우면 버튼이 표시되지 않습니다">
              <input value={form.cta_label} onChange={set("cta_label")} maxLength={30} placeholder="참가 신청하기" className={inputCls} />
            </Field>
            <Field label="링크 URL">
              <input type="url" value={form.cta_url} onChange={set("cta_url")} placeholder="https://hackon.kr/e/002e1704" className={inputCls} />
            </Field>
          </div>
          <Field label="이미지" hint="배너 오른쪽에 표시됩니다 · jpg, png, webp · 최대 5MB (선택)">
            <div className="flex items-center gap-4">
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="미리보기" className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-navy-700" />
              )}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-navy-700 dark:text-slate-300">
                  {uploading ? "업로드 중..." : form.image_url ? "다른 파일 선택" : "파일 선택"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={handleUpload} />
                </label>
                {form.image_url && (
                  <button type="button" onClick={() => setForm({ ...form, image_url: "" })} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                )}
              </div>
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="노출 시작 (한국시간)" required>
              <input type="datetime-local" value={form.starts_at} onChange={set("starts_at")} required className={inputCls} />
            </Field>
            <Field label="노출 종료 (한국시간)" required hint="이 시각이 지나면 소개 문구로 자동 복귀합니다">
              <input type="datetime-local" value={form.ends_at} onChange={set("ends_at")} required className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.is_enabled} onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })} />
            활성화
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || uploading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {saving ? "저장 중..." : "저장"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-navy-700 dark:text-slate-300">취소</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => { setError(null); setForm(emptyForm(nowMs)); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
          + 새 홍보
        </button>
      )}

      {promotions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-navy-700">등록된 홍보가 없습니다.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          {promotions.map((promotion) => {
            const status = getStatus(promotion, nowMs);
            return (
              <div key={promotion.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-navy-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{promotion.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{formatKst(promotion.starts_at)} ~ {formatKst(promotion.ends_at)} (KST)</p>
                </div>
                <button type="button" onClick={() => setForm(toForm(promotion))} className="text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300">수정</button>
                <button type="button" disabled={processing === promotion.id} onClick={() => handleToggle(promotion)} className="text-xs font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-50 dark:text-slate-300">
                  {promotion.is_enabled ? "비활성화" : "활성화"}
                </button>
                <button type="button" disabled={processing === promotion.id} onClick={() => handleDelete(promotion)} className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50">삭제</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
