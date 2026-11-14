"use client";

// Kid mode: the phone is in the child's hands. Big buddy, big buttons, no parent controls. The
// way back to the parent's side is a button that must be held for three seconds.

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { Icon } from "@/components/icons";
import { KidStage } from "@/components/kid/stage";
import { todayFor } from "@/lib/plan/today";
import { useFamily } from "@/lib/store/family";

const HOLD_MS = 3000;

/** Fills a ring while held; lets go early and it empties. */
function ParentGate({ onOpen }: { onOpen: () => void }) {
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
      className="flex touch-none select-none items-center gap-2 rounded-full bg-white/70 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-night/70"
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

export default function PlayPage() {
  const router = useRouter();
  const { ready, active: kid } = useFamily();
  const [say, setSay] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (ready && !kid) router.replace("/welcome");
  }, [ready, kid, router]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function react(text: string) {
    setSay(text);
    setCheer(true);
    timers.current.forEach(clearTimeout);
    timers.current = [setTimeout(() => setCheer(false), 1600), setTimeout(() => setSay(null), 3200)];
  }

  if (!kid) return <div className="min-h-dvh flex-1 bg-sky" />;
  const games = todayFor(kid);
  const bubble = say ?? `Hi, ${kid.name}! Ready to play?`;

  return (
    <KidStage>
        <div className="relative flex items-center justify-between">
          <ParentGate onOpen={() => router.push("/home")} />
          <motion.div key={kid.stars} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-lg font-semibold">
            <Icon name="star" size={24} /> {kid.stars}
          </motion.div>
        </div>

        <div className="relative mt-6 grid justify-items-center">
          <div className="grid min-h-[84px] items-end">
          <AnimatePresence mode="wait">
            <motion.p
              key={bubble}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="relative max-w-[280px] rounded-[26px] bg-white px-5 py-3 text-center text-[22px] font-semibold leading-tight shadow-[0_8px_20px_rgba(27,20,51,0.1)]"
              aria-live="polite"
            >
              {bubble}
              <span className="absolute -bottom-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[4px] bg-white" aria-hidden="true" />
            </motion.p>
          </AnimatePresence>
          </div>
          <motion.button
            type="button"
            aria-label={`${kid.name}'s buddy`}
            whileTap={{ scale: 0.9 }}
            onClick={() => react(["Hee hee, that tickles!", "Let’s go!", "You’re a star!", "Boop!"][Math.floor(Math.random() * 4)])}
            className="mt-3"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 12 }}
          >
            <AnimalBuddy animal={kid.avatar} size={200} mood={cheer ? "cheer" : "happy"} />
          </motion.button>
        </div>

        <p className="relative mt-6 text-center text-lg font-semibold text-night/70">Today’s games</p>
        <div className="relative mt-3 grid grid-cols-3 gap-3">
          {games.map((g, i) => (
            <motion.button
              key={g.id}
              type="button"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.25 + i * 0.1 }}
              whileTap={{ scale: 0.9, rotate: -3 }}
              onClick={() => (g.ready ? router.push(`/play/${g.id}`) : react(`${g.title} is coming soon!`))}
              className={`grid aspect-[4/5] content-center justify-items-center gap-2 rounded-[28px] p-2 shadow-[0_8px_0_rgba(27,20,51,0.12)] ${g.tone}`}
            >
              <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}>
                <Icon name={g.icon} size={52} />
              </motion.span>
              <span className="text-center text-[15px] font-semibold leading-tight">{g.title}</span>
            </motion.button>
          ))}
        </div>

        <motion.div whileTap={{ scale: 0.96 }} className="relative mt-auto pt-8">
          <Link href="/assistant" className="flex h-16 items-center justify-center gap-3 rounded-full bg-white text-xl font-semibold shadow-[0_8px_0_rgba(27,20,51,0.12)]">
            <span className="assistant-orb h-9 w-9 rounded-full" aria-hidden="true" /> Talk to Buddy
          </Link>
        </motion.div>
    </KidStage>
  );
}
