"use client";

import { useState } from "react";
import { updateNotificationPreferences, type NotificationPreferences } from "@/lib/actions/settings";

const options: Array<{ key: keyof NotificationPreferences; title: string; description: string }> = [
  { key: "email_comments", title: "내 제품이나 Dev Log에 댓글", description: "누군가 내 제품이나 Dev Log에 댓글을 남겼을 때" },
  { key: "email_replies", title: "내 댓글에 답글", description: "누군가 내 댓글에 답글을 남겼을 때" },
  { key: "email_upvotes", title: "내 제품 업보트", description: "누군가 내 제품을 업보트했을 때" },
  { key: "email_product_status", title: "제품 심사 결과", description: "제품이 승인되거나 반려되었을 때" },
  { key: "email_claims", title: "소유권 알림", description: "제품 소유권 요청이 발생하거나 처리되었을 때" },
];

export default function NotificationSettingsForm({ initial }: { initial: NotificationPreferences }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof NotificationPreferences) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
    setStatus(null);
  };

  const save = async () => {
    setSaving(true);
    const result = await updateNotificationPreferences(form);
    setSaving(false);
    setStatus(result.error ?? "저장되었습니다.");
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button key={option.key} type="button" onClick={() => toggle(option.key)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-navy-800">
          <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${form[option.key] ? "bg-blue-600" : "bg-slate-200 dark:bg-navy-700"}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form[option.key] ? "left-6" : "left-1"}`} />
          </span>
          <span><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{option.title}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span></span>
        </button>
      ))}
      <div className="flex items-center gap-4 pt-4">
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-blue-600">{saving ? "저장 중..." : "저장하기"}</button>
        {status && <span className={status === "저장되었습니다." ? "text-sm text-green-600" : "text-sm text-red-600"}>{status}</span>}
      </div>
    </div>
  );
}