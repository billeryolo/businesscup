"use client";

// Small pieces shared by the onboarding screens: buttons, the countdown ring, confetti, and a
// number that counts up.

import { animate, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

type ButtonProps = { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: "dark" | "light" | "ghost"; className?: string };

export function BigButton({ children, onClick, disabled, tone = "dark", className = "" }: ButtonProps) {
  const tones = {
    dark: "bg-night text-white shadow-[0_10px_24px_rgba(27,20,51,0.28)]",
    light: "bg-white text-night shadow-[0_6px_18px_rgba(27,20,51,0.10)]",
    ghost: "text-night-soft",
  };
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 w-full rounded-full px-6 text-base font-semibold transition-opacity disabled:opacity-40 ${tones[tone]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

/** Seconds left, as a ring that empties. */
export function TimerRing({ remaining, total = 60, size = 60 }: { remaining: number; total?: number; size?: number }) {
  const r = 25;
  const c = 2 * Math.PI * r;
  const left = Math.max(0, Math.min(1, remaining / total));
  return (
    <div className="relative grid flex-none place-items-center" style={{ width: size, height: size }} role="timer" aria-label={`${Math.ceil(remaining)} seconds left`}>
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="6" className="stroke-lilac-soft" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left)}
          className={remaining <= 10 ? "stroke-candy" : "stroke-night"}
          style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="text-[17px] font-semibold tabular-nums">{Math.ceil(remaining)}</span>
    </div>
  );
}

const CONFETTI = ["#f29be3", "#f4b56e", "#a9e5c9", "#6fb6ef", "#c5bff5", "#f6c453"];

/** One burst from the centre of the parent, which needs `relative`. Skipped for reduced motion. */
export function Confetti({ pieces = 26 }: { pieces?: number }) {
  const still = useReducedMotion();
  if (still) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        // Spread evenly with a fixed wobble, so the burst looks random but renders the same every time.
        const angle = (i / pieces) * Math.PI * 2 + (i % 3) * 0.4;
        const reach = 90 + ((i * 37) % 70);
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 block h-2.5 w-2.5"
            style={{ background: CONFETTI[i % CONFETTI.length], borderRadius: i % 2 ? 9999 : 3 }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * reach,
              y: [0, Math.sin(angle) * reach - 30, Math.sin(angle) * reach + 60],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1.1, 0.8],
              rotate: (i % 2 ? 1 : -1) * (180 + i * 20),
            }}
            transition={{ duration: 1.5, delay: 0.25 + (i % 5) * 0.04, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

/** Counts from 0 to `value` once, when it appears. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, { duration: still ? 0 : 1.1, delay: still ? 0 : 0.3, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [value, still]);
  return (
    <span className={className} aria-label={String(value)}>
      {shown}
    </span>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onClick} aria-label="Back" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white shadow-[0_4px_12px_rgba(27,20,51,0.08)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </motion.button>
  );
}
