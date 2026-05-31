"use client";

import { useActionState, useEffect, useState } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding";

const initialState = { error: undefined as string | undefined };

interface OnboardingFormProps {
  defaultDisplayName: string;
  defaultUsername: string;
}

export default function OnboardingForm({ defaultDisplayName, defaultUsername }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const [username, setUsername] = useState(defaultUsername);

  return (
    <form action={formAction} className="space-y-5">
      {/* 이름 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="display_name"
          defaultValue={defaultDisplayName}
          placeholder="홍길동"
          required
          maxLength={50}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* 유저네임 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          유저네임 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 px-4 py-2.5 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="mr-1 text-sm text-slate-400">@</span>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="username"
            required
            minLength={3}
            maxLength={20}
            className="flex-1 text-sm outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">영문 소문자, 숫자, 밑줄(_) 3~20자</p>
      </div>

      {/* 소개 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          한 줄 소개
        </label>
        <textarea
          name="bio"
          placeholder="어떤 것을 만들고 계신가요?"
          rows={3}
          maxLength={200}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* 웹사이트 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          웹사이트
        </label>
        <input
          type="url"
          name="website_url"
          placeholder="https://yoursite.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* X (Twitter) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          X (Twitter)
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 px-4 py-2.5 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="mr-1 text-sm text-slate-400">x.com/</span>
          <input
            type="text"
            name="twitter_url"
            placeholder="handle"
            maxLength={50}
            className="flex-1 text-sm outline-none"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
