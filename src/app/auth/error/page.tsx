export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">로그인 오류</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400">로그인 중 문제가 발생했습니다. 다시 시도해주세요.</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
