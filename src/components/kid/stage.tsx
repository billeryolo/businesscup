// The sky every kid screen sits on: a phone-width column with drifting clouds.

import type { ReactNode } from "react";

export function KidStage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 bg-sky-deep font-kid text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-gradient-to-b from-sky to-sky-soft px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
        <div className="cloud-drift absolute left-4 top-24 h-10 w-28 rounded-full bg-white/80" aria-hidden="true" />
        <div className="cloud-drift absolute right-2 top-44 h-8 w-24 rounded-full bg-white/70 [animation-delay:-9s]" aria-hidden="true" />
        <div className="cloud-drift absolute left-24 top-[300px] h-7 w-20 rounded-full bg-white/60 [animation-delay:-17s]" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
