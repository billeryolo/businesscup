"use client";

// The 1-minute math and letters checks. Math: the child types answers on a big keypad. Letters:
// the child names the letter and the parent taps whether they knew it. The friend cheers along.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { makeQuickItems, type QuickItem, type QuickKind, quickLevel, quickScore, quickTooShort } from "@/lib/checks/quick";
import type { QuickResult } from "@/lib/checks/result";
import type { Kid } from "@/lib/store/family";
import { Icon } from "@/components/icons";
import { BigButton, TimerRing } from "./bits";

const TIME_LIMIT = 60;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0"];

export function QuickCheck({ kind, kid, onResult }: { kind: QuickKind; kid: Kid; onResult: (result: QuickResult) => void }) {
  const level = quickLevel(kind, kid.grade);
  const [items, setItems] = useState<QuickItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const [tooShort, setTooShort] = useState(false);

  // The clock and the answer handlers both need the running totals, so they live in a ref.
  const stats = useRef({ correct: 0, attempted: 0, missed: [] as string[] });
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (tick.current) clearInterval(tick.current);
    if (pause.current) clearTimeout(pause.current);
  }, []);

  function finish(seconds: number) {
    if (tick.current) clearInterval(tick.current);
    if (pause.current) clearTimeout(pause.current);
    tick.current = null;
    const { correct, attempted, missed } = stats.current;
    if (quickTooShort(attempted, seconds)) {
      setItems(null);
      setFeedback(null);
      setTooShort(true);
      return;
    }
    onResult({ kind, score: quickScore(correct, seconds), correct, attempted, seconds, missed: [...new Set(missed)] });
  }

  function begin() {
    stats.current = { correct: 0, attempted: 0, missed: [] };
    setItems(makeQuickItems(kind, kid.grade));
    setIndex(0);
    setInput("");
    setElapsed(0);
    setTooShort(false);
    let startedAt: number | null = null;
    tick.current = setInterval(() => {
      startedAt ??= performance.now();
      const now = (performance.now() - startedAt) / 1000;
      setElapsed(now);
      if (now >= TIME_LIMIT) finish(TIME_LIMIT);
    }, 100);
  }

  function record(right: boolean, item: QuickItem) {
    stats.current.attempted++;
    if (right) stats.current.correct++;
    else stats.current.missed.push(kind === "math" ? `${item.prompt} = ${item.answer}` : item.prompt);
    setFeedback(right ? "right" : "wrong");
    pause.current = setTimeout(
      () => {
        setFeedback(null);
        setInput("");
        setIndex((i) => i + 1);
      },
      right ? 220 : 520,
    );
  }

  function press(key: string, item: QuickItem) {
    if (feedback) return;
    if (key === "del") return setInput((v) => v.slice(0, -1));
    const next = input + key;
    setInput(next);
    if (next.length >= item.answer.length) record(next === item.answer, item);
  }

  if (!items) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="grid justify-items-center gap-4 pt-6 text-center">
          <AvatarBubble animal={kid.avatar} size={132} mood="happy" />
          <h1 className="text-[26px] font-semibold leading-tight">{kind === "math" ? "1-minute math check" : "1-minute letters check"}</h1>
          <p className="max-w-[300px] text-[15px] leading-snug text-night-soft">
            {kind === "math"
              ? `${kid.name} answers as many as they can: ${level.label}. Hand over the phone, or type what ${kid.name} says.`
              : `A letter appears and ${kid.name} says its name. You tap whether they knew it. We use ${level.label}.`}
          </p>
          {tooShort ? <p className="rounded-3xl bg-peach/40 px-5 py-4 text-sm font-medium">That was too short to tell anything. Try to keep going for the whole minute.</p> : null}
        </div>
        <div className="mt-auto pt-8">
          <BigButton onClick={begin}>{tooShort ? "Try again" : "Start"}</BigButton>
        </div>
      </div>
    );
  }

  const item = items[index % items.length];
  const tone = feedback === "right" ? "bg-mint" : feedback === "wrong" ? "bg-candy/60" : "bg-sky";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-4">
        <TimerRing remaining={TIME_LIMIT - elapsed} />
        <p className="text-sm font-medium text-night-soft">
          <span className="text-2xl font-semibold text-night tabular-nums">{index}</span> done
        </p>
        <div className="ml-auto">
          <AvatarBubble animal={kid.avatar} size={60} mood={feedback === "right" ? "cheer" : feedback === "wrong" ? "oops" : "idle"} />
        </div>
      </div>

      <motion.div
        animate={feedback === "wrong" ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className={`relative grid min-h-[190px] flex-1 place-items-center overflow-hidden rounded-[32px] font-kid transition-colors duration-150 ${tone}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            className="text-center"
            aria-live="polite"
          >
            {kind === "math" ? (
              <>
                <p className="text-[56px] font-semibold leading-none">{item.prompt}</p>
                <p className="mx-auto mt-4 grid h-16 min-w-24 place-items-center rounded-2xl bg-white/80 px-4 text-[40px] font-semibold tabular-nums">{input || " "}</p>
              </>
            ) : (
              <p className="text-[132px] font-semibold leading-none">{item.prompt}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {kind === "math" ? (
        <div className="grid grid-cols-3 gap-2 font-kid">
          {KEYS.map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => press(key, item)}
              aria-label={key === "del" ? "Delete" : key}
              className={`h-[60px] rounded-2xl bg-white text-[28px] font-semibold grid place-items-center shadow-[0_4px_0_rgba(27,20,51,0.10)] ${key === "0" ? "col-span-2" : ""}`}
            >
              {key === "del" ? <Icon name="backspace" size={30} /> : key}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <motion.button type="button" whileTap={{ scale: 0.94 }} disabled={!!feedback} onClick={() => record(false, item)} className="h-[72px] rounded-3xl bg-white text-lg font-semibold shadow-[0_4px_0_rgba(27,20,51,0.10)]">
            Not yet
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.94 }} disabled={!!feedback} onClick={() => record(true, item)} className="h-[72px] rounded-3xl bg-night text-lg font-semibold text-white shadow-[0_4px_0_rgba(27,20,51,0.35)]">
            Knew it
          </motion.button>
        </div>
      )}

      <BigButton tone="ghost" onClick={() => finish(Math.min(elapsed, TIME_LIMIT))} className="!min-h-11">
        Finish early
      </BigButton>
    </div>
  );
}
