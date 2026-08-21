"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/lib/actions/settings";

export default function SecuritySettingsForm({ email }: { email: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState(email);
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ email: newEmail.trim() });
    setMessage(error ? error.message : "확인 메일을 새 주소로 보냈습니다.");
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const removeAccount = async () => {
    if (prompt("탈퇴하려면 탈퇴를 입력해주세요.") !== "탈퇴") return;
    setDeleting(true);
    const result = await deleteAccount();
    if (result.error) {
      setDeleting(false);
      setMessage(result.error);
      return;
    }
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">이메일 주소</h2>
        <form onSubmit={updateEmail} className="mt-4 flex gap-2">
          <input type="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100" />
          <button type="submit" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-600">변경</button>
        </form>
        <p className="mt-2 text-xs text-slate-400">변경 후 새 이메일 주소로 확인 메일이 발송됩니다.</p>
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">로그아웃</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">현재 브라우저에서 로그아웃합니다.</p>
        <button type="button" onClick={() => void signOut()} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-navy-700 dark:text-slate-200">로그아웃</button>
      </section>
      <section className="rounded-2xl border border-red-100 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-semibold text-red-700 dark:text-red-300">회원 탈퇴</h2>
        <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">계정과 프로필이 삭제되며 이 작업은 되돌릴 수 없습니다.</p>
        <button type="button" disabled={deleting} onClick={() => void removeAccount()} className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50 dark:border-red-900 dark:text-red-300">{deleting ? "처리 중..." : "회원 탈퇴"}</button>
      </section>
      {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
    </div>
  );
}