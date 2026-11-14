// The sky every kid screen sits on: a phone-width column with drifting clouds.

import type { ReactNode } from "react";

/**
 * How kid-mode buttons and tiles are lit, to match the soft avatars: a highlight along the top
 * edge, a darker band along the bottom, and a soft shadow underneath. No hard slabs.
 */
export const clay = "shadow-[inset_0_2px_0_rgba(255,255,255,0.75),inset_0_-6px_0_rgba(27,20,51,0.07),0_14px_24px_-8px_rgba(27,20,51,0.22)]";
export const clayDark = "shadow-[inset_0_2px_0_rgba(255,255,255,0.16),inset_0_-6px_0_rgba(0,0,0,0.3),0_14px_24px_-8px_rgba(27,20,51,0.45)]";

function Cloud({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 120 62" className={`cloud-drift absolute drop-shadow-[0_6px_10px_rgba(111,182,239,0.25)] ${className}`} aria-hidden="true">
      <g fill="#fff">
        <ellipse cx="60" cy="44" rx="54" ry="16" />
        <circle cx="38" cy="32" r="18" />
        <circle cx="66" cy="25" r="23" />
        <circle cx="90" cy="36" r="14" />
      </g>
    </svg>
  );
}

export function KidStage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 bg-sky-deep font-kid text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-gradient-to-b from-[#a8d6fb] via-sky to-sky-soft px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,244,200,0.9),rgba(255,244,200,0)_70%)]" aria-hidden="true" />
        <Cloud className="left-2 top-20 w-32 opacity-90" />
        <Cloud className="right-0 top-44 w-24 opacity-75 [animation-delay:-9s]" />
        <Cloud className="left-20 top-[310px] w-20 opacity-60 [animation-delay:-17s]" />
        {children}
      </div>
    </div>
  );
}
