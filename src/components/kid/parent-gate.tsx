"use client";

// The way back from kid mode to the parent's side: a button that must be held for 3 seconds.

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 3000;

/** Fills a ring while held; lets go early and it empties. */
export function ParentGate({ onOpen }: { onOpen: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    setHolding(true);
    timer.current = setTimeout(onOpen, HOLD_MS);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !e.repeat && start()}
      onKeyUp={stop}
      aria-label="Parent: hold for 3 seconds to leave kid mode"
      className="flex touch-none select-none items-center gap-2 rounded-full bg-white/85 py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-night/70 shadow-[0_6px_14px_-6px_rgba(27,20,51,0.25)]"
    >
      <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(27,20,51,0.12)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="#1b1433"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          style={{ strokeDashoffset: holding ? 0 : 1, transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : "stroke-dashoffset 200ms ease-out" }}
        />
      </svg>
      {holding ? "Keep holding…" : "Parent"}
    </button>
  );
}
