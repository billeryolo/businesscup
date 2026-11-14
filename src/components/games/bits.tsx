"use client";

// The parts every kid game shares: the page around it, the back button, the hello screen and
// the stars screen at the end.

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { Icon } from "@/components/icons";
import { clay, clayDark, KidStage } from "@/components/kid/stage";
import { type Kid, useFamily } from "@/lib/store/family";

export const chunky = `rounded-[28px] font-semibold ${clay}`;
export const chunkyDark = `rounded-[28px] bg-night font-semibold text-white ${clayDark}`;

/** The sky, the active child, and a way back to wherever the game was opened from. */
export function GamePage({ children }: { children: (kid: Kid, exit: () => void) => ReactNode }) {
  const router = useRouter();
  const { ready, active: kid } = useFamily();
  useEffect(() => {
    if (ready && !kid) router.replace("/welcome");
  }, [ready, kid, router]);
  const exit = () => (window.history.length > 1 ? router.back() : router.replace("/play"));
  if (!kid) return <div className="min-h-dvh flex-1 bg-sky" />;
  return <KidStage>{children(kid, exit)}</KidStage>;
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={onClick} aria-label="Back" className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white/85 shadow-[0_6px_14px_-6px_rgba(27,20,51,0.25)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.500 5.500 8 12l6.500 6.500" />
      </svg>
    </motion.button>
  );
}

/** Top row while playing: back, one bar per question, stars so far. */
export function GameTop({ onExit, total, done, stars }: { onExit: () => void; total: number; done: number; stars: number }) {
  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={onExit} />
      <div className="flex flex-1 justify-center gap-1.5" aria-label={`${done} of ${total} done`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-2.5 flex-1 rounded-full transition-colors ${i < done ? "bg-night" : "bg-white/70"}`} />
        ))}
      </div>
      <motion.div key={stars} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-lg font-semibold tabular-nums">
        <Icon name="star" size={22} /> {stars}
      </motion.div>
    </div>
  );
}

export function GameIntro({ kid, title, line, onGo, onExit }: { kid: Kid; title: string; line: string; onGo: () => void; onExit: () => void }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex">
        <BackButton onClick={onExit} />
      </div>
      <div className="grid flex-1 content-center justify-items-center gap-3 text-center">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 12 }}>
          <AnimalBuddy animal={kid.avatar} size={190} mood="wave" />
        </motion.div>
        <h1 className="text-[40px] font-semibold leading-none">{title}</h1>
        <p className="max-w-[270px] text-xl font-medium leading-snug text-night/70">{line}</p>
      </div>
      <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onGo} className={`h-[72px] text-2xl ${chunkyDark}`}>
        Go!
      </motion.button>
    </div>
  );
}

export function GameDone({ kid, stars, total, line, onAgain, onExit }: { kid: Kid; stars: number; total: number; line: string; onAgain: () => void; onExit: () => void }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="grid flex-1 content-center justify-items-center gap-3 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 11 }}>
          <AnimalBuddy animal={kid.avatar} size={200} mood={stars > 0 ? "cheer" : "happy"} />
        </motion.div>
        <h1 className="text-[38px] font-semibold leading-none">{stars === total ? "Perfect!" : stars >= total / 2 ? "Great job!" : "Good try!"}</h1>
        <motion.p
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.3 }}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[32px] font-semibold shadow-[0_8px_20px_rgba(27,20,51,0.1)]"
        >
          <Icon name="star" size={40} /> +{stars}
        </motion.p>
        <p className="text-lg font-medium text-night/70">{line}</p>
      </div>
      <div className="grid gap-3">
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onAgain} className={`h-[68px] text-xl ${chunkyDark}`}>
          Play again
        </motion.button>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onExit} className={`h-[60px] bg-white text-lg ${chunky}`}>
          All done
        </motion.button>
      </div>
    </div>
  );
}
