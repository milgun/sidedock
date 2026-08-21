"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { updateThemePreference } from "@/lib/actions/profile";

const themes = [
  { value: "light", label: "라이트", icon: "☀️" },
  { value: "dark", label: "다크", icon: "🌙" },
  { value: "system", label: "시스템", icon: "💻" },
] as const;

export default function ThemeSettingsForm({ initial }: { initial: string }) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);

  const select = async (value: (typeof themes)[number]["value"]) => {
    setSelected(value);
    setTheme(value);
    const result = await updateThemePreference(value);
    setStatus(result.error ?? "저장되었습니다.");
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button key={theme.value} type="button" onClick={() => void select(theme.value)} aria-pressed={selected === theme.value} className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition ${selected === theme.value ? "border-blue-400 bg-blue-50 text-blue-600 dark:bg-navy-800 dark:text-blue-300" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-navy-700 dark:text-slate-300"}`}>
            <span className="text-lg">{theme.icon}</span>{theme.label}
          </button>
        ))}
      </div>
      {status && <p className="mt-4 text-sm text-green-600">{status}</p>}
    </div>
  );
}