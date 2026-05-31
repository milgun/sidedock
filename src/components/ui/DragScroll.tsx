"use client";

import { useRef } from "react";

interface DragScrollProps {
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}

export default function DragScroll({ className, innerClassName, children }: DragScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ dragging: false, startX: 0, scrollStart: 0, moved: 0 });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 링크/이미지 네이티브 드래그 방지 (이게 없으면 mousemove가 끊김)
    e.preventDefault();
    const s = state.current;
    s.dragging = true;
    s.startX = e.clientX;
    s.scrollStart = ref.current?.scrollLeft ?? 0;
    s.moved = 0;
    if (ref.current) {
      ref.current.style.cursor = "grabbing";
      ref.current.style.userSelect = "none";
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging || !ref.current) return;
    const dx = e.clientX - s.startX;
    s.moved = Math.abs(dx);
    ref.current.scrollLeft = s.scrollStart - dx;
  };

  const stop = () => {
    state.current.dragging = false;
    if (ref.current) {
      ref.current.style.cursor = "grab";
      ref.current.style.userSelect = "";
    }
  };

  // 드래그가 5px 이상이면 클릭(Link 이동) 방지
  const onClickCapture = (e: React.MouseEvent) => {
    if (state.current.moved > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ cursor: "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}
