"use client";

// Speed math, the game: ten quick facts, three answers to tap, the buddy cheering along. Every
// right answer is a star. Nothing is timed on screen; the time only shows at the end.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { chunky, GameDone, GameIntro, GameTop } from "./bits";
import { makeRound, type MathItem } from "@/lib/games/speed-math";
import { familyActions, type Kid } from "@/lib/store/family";


function Dots({ count, tone }: { count: number; tone: string }) {
  return (
    <span className="flex max-w-[120px] flex-wrap justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.1 + i * 0.06 }} className={`h-5 w-5 rounded-full ${tone}`} />
      ))}
    </span>
  );
}

export function SpeedMath({ kid, onExit }: { kid: Kid; onExit: () => void }) {
  const [round, setRound] = useState<MathItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const startedAt = useRef(0);
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (pause.current && clearTimeout(pause.current)), []);

  function begin() {
    setRound(makeRound(kid.grade));
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setSeconds(null);
    startedAt.current = performance.now();
  }

  function pick(choice: number, item: MathItem, items: MathItem[]) {
    if (picked !== null) return;
    const right = choice === item.answer;
    const total = correct + (right ? 1 : 0);
    setPicked(choice);
    setCorrect(total);
    // A wrong answer stays up a little longer so the right one can be seen.
    pause.current = setTimeout(
      () => {
        setPicked(null);
        if (index + 1 < items.length) return setIndex(index + 1);
        setSeconds(Math.round((performance.now() - startedAt.current) / 1000));
        if (total > 0) familyActions.updateKid(kid.id, { stars: kid.stars + total });
      },
      right ? 700 : 1500,
    );
  }

  if (!round) return <GameIntro kid={kid} title="Speed math" line="Ten quick ones. Tap the right answer!" onGo={begin} onExit={onExit} />;
  if (seconds !== null) return <GameDone kid={kid} stars={correct} total={round.length} line={`${correct} of ${round.length} right in ${seconds} seconds`} onAgain={begin} onExit={onExit} />;

  const item = round[index];
  const answered = picked !== null;
  const right = picked === item.answer;

  return (
    <div className="relative flex flex-1 flex-col">
      <GameTop onExit={onExit} total={round.length} done={index + (answered ? 1 : 0)} stars={correct} />

      <div className="mt-4 flex justify-center">
        <AnimalBuddy animal={kid.avatar} size={132} mood={!answered ? "happy" : right ? "cheer" : "oops"} />
      </div>

      <motion.div
        animate={answered && !right ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mt-2 grid min-h-[170px] flex-1 place-items-center overflow-hidden rounded-[36px] bg-white shadow-[0_8px_20px_rgba(27,20,51,0.08)]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 480, damping: 26 }}
            className="grid justify-items-center gap-4 p-4"
            aria-live="polite"
          >
            <p className="text-[64px] font-semibold leading-none">
              {item.prompt} <span className="text-night/35">=</span> <span className={answered ? (right ? "text-[#23936A]" : "text-night") : "text-night/35"}>{answered ? item.answer : "?"}</span>
            </p>
            {item.dots ? (
              <div className="flex items-center gap-4">
                <Dots count={item.dots[0]} tone="bg-peach" />
                <span className="text-2xl font-semibold text-night/40">+</span>
                <Dots count={item.dots[1]} tone="bg-candy" />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {item.choices.map((choice, i) => {
          const tone = !answered ? "bg-white" : choice === item.answer ? "bg-mint" : choice === picked ? "bg-candy/70" : "bg-white/50 text-night/40";
          return (
            <motion.button
              key={`${index}-${choice}`}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={answered && choice === item.answer ? { opacity: 1, y: -10 } : { opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: answered ? 0 : i * 0.06 }}
              whileTap={answered ? undefined : { scale: 0.9 }}
              onClick={() => pick(choice, item, round)}
              className={`h-[88px] text-[40px] tabular-nums transition-colors ${chunky} ${tone}`}
            >
              {choice}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
