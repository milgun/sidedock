import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function HighlightText({
  text,
  query,
  className,
  highlightClassName = "rounded bg-blue-100 px-0.5 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
}: {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmed)})`, "ig");
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;
        const isMatch = part.toLowerCase() === trimmed.toLowerCase();
        return isMatch ? (
          <mark key={`${part}-${index}`} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </span>
  );
}
