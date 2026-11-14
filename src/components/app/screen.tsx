"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Title row at the top of a tab. */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 pb-5 pt-2">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-night-soft">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

/** Children slide up and fade in one after another when a screen opens. */
export function Stagger({ children, className }: { children: ReactNode[]; className?: string }) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}>
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/** Honest placeholder for a tab that gets its real content in a later pull request. */
export function ComingNext({ items }: { items: string[] }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">Coming next</p>
      <ul className="mt-3 grid gap-2 text-[15px]">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className="mt-[7px] h-2 w-2 flex-none rounded-full bg-candy" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
