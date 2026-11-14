"use client";

// The 1-minute reading check. Either the app listens and follows along, or the parent listens and
// taps the words read wrong. Afterwards the parent can fix any word before seeing the result.

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PassageView } from "@/components/check/passage-view";
import { align, type SpokenWord } from "@/lib/reading/align";
import { type Assessment, assess } from "@/lib/reading/assess";
import type { Grade } from "@/lib/reading/norms";
import { isTooShort } from "@/lib/reading/score";
import { DEMO_PROFILES } from "@/lib/reading/simulate";
import type { PassageWord } from "@/lib/reading/text";
import { useDemoReader } from "@/lib/speech/use-demo-reader";
import { useSpeechRecognition, useSpeechSupported } from "@/lib/speech/use-speech-recognition";
import { BigButton, TimerRing } from "./bits";

const TIME_LIMIT = 60;
type Mode = "live" | "manual" | "demo";

type Props = {
  passage: PassageWord[];
  title: string;
  kidName: string;
  grade: Grade;
  onResult: (assessment: Assessment) => void;
};

export function ReadingCheck(props: Props) {
  const supported = useSpeechSupported();
  const [picked, setPicked] = useState<Mode | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mode = picked ?? (supported ? "live" : "manual");
  // A new key starts the run from scratch: on a mode switch and on "Read again".
  return <Run key={`${mode}-${attempt}`} {...props} mode={mode} supported={supported} onMode={setPicked} onRestart={() => setAttempt((n) => n + 1)} />;
}

const MODES: { mode: Mode; label: string }[] = [
  { mode: "live", label: "App listens" },
  { mode: "manual", label: "I’ll mark it" },
  { mode: "demo", label: "Demo" },
];
const NOTHING_HEARD: SpokenWord[] = [];

type Done = { spoken: SpokenWord[]; seconds: number; at: Date };

function Run({ passage, title, kidName, grade, mode, supported, onMode, onRestart, onResult }: Props & { mode: Mode; supported: boolean; onMode: (m: Mode) => void; onRestart: () => void }) {
  const speech = useSpeechRecognition();
  const demo = useDemoReader(passage, DEMO_PROFILES.guesser);
  const source = mode === "demo" ? demo : speech;
  const spoken = mode === "manual" ? NOTHING_HEARD : source.words;

  const [phase, setPhase] = useState<"ready" | "reading" | "pickLast" | "review">("ready");
  const [elapsed, setElapsed] = useState(0);
  const [waited, setWaited] = useState(0);
  const [manualSeconds, setManualSeconds] = useState(0);
  const [marks, setMarks] = useState<Set<number>>(() => new Set());
  const [done, setDone] = useState<Done | null>(null);

  const alignment = useMemo(() => align(passage, spoken), [passage, spoken]);
  const latest = useRef({ alignment, spoken });
  useEffect(() => {
    latest.current = { alignment, spoken };
  });

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (tick.current) clearInterval(tick.current);
  }, []);

  const assessment = useMemo(
    () => (done ? assess({ passage, spoken: done.spoken, seconds: done.seconds, grade, date: done.at, parentMarks: marks }) : null),
    [done, passage, grade, marks],
  );

  function finish(seconds: number) {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    if (mode === "manual") {
      setManualSeconds(seconds);
      setPhase("pickLast");
      return;
    }
    source.stop();
    setMarks(new Set());
    setDone({ spoken: latest.current.spoken, seconds, at: new Date() });
    setPhase("review");
  }

  function begin() {
    setPhase("reading");
    const startedAt = performance.now();
    if (mode !== "manual") source.start();
    // The minute starts with the first word heard, as in a teacher-run check. When the parent
    // marks it, they press start as the child begins.
    tick.current = setInterval(() => {
      const now = (performance.now() - startedAt) / 1000;
      const first = mode === "manual" ? 0 : latest.current.spoken[0]?.t;
      const reading = first === undefined ? 0 : Math.max(0, now - first);
      setElapsed(reading);
      if (first === undefined) setWaited(now);
      const reachedEnd = mode !== "manual" && latest.current.alignment.lastAttempted === passage.length - 1;
      if (reading >= TIME_LIMIT || reachedEnd) finish(Math.min(reading, TIME_LIMIT));
    }, 100);
  }

  function toggleMark(i: number) {
    setMarks((m) => {
      const next = new Set(m);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function pickLast(i: number) {
    setMarks((m) => new Set([...m].filter((x) => x <= i)));
    setDone({ spoken: passage.slice(0, i + 1).map((w) => ({ norm: w.norm })), seconds: manualSeconds, at: new Date() });
    setPhase("review");
  }

  const remaining = phase === "ready" ? TIME_LIMIT : Math.max(0, TIME_LIMIT - elapsed);
  const waitingForFirstWord = phase === "reading" && mode !== "manual" && spoken.length === 0;
  const hearsNothing = waitingForFirstWord && mode === "live" && waited >= 8 && !speech.error;
  const micProblem = mode === "live" && (speech.error || hearsNothing);

  if (phase === "review" && assessment) {
    const { score } = assessment;
    const tooShort = isTooShort(score);
    const cut = Math.min(passage.length, assessment.alignment.lastAttempted + 9);
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">Check the scoring</h1>
          <p className="mt-1 text-sm text-night-soft">Red words count as mistakes. Tap any word to flip it.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { value: score.wcpm, label: "words a minute" },
            { value: `${Math.round(score.accuracy * 100)}%`, label: "accuracy" },
            { value: score.errors, label: score.errors === 1 ? "mistake" : "mistakes" },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl bg-white px-2 py-4">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-xs text-night-soft">{s.label}</p>
            </div>
          ))}
        </div>
        {tooShort ? <p className="rounded-3xl bg-peach/40 px-5 py-4 text-sm font-medium">That was too little reading to compare with other children. Try again and read for the whole minute.</p> : null}
        <div className="rounded-[28px] bg-white p-5">
          <PassageView passage={passage.slice(0, cut)} words={assessment.alignment.words} lastAttempted={assessment.alignment.lastAttempted} mode="review" onTap={toggleMark} />
        </div>
        <div className="sticky bottom-0 -mx-5 mt-auto grid gap-2 bg-gradient-to-t from-mist from-70% to-transparent px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6">
          <BigButton disabled={tooShort} onClick={() => onResult(assessment)}>
            See result
          </BigButton>
          <BigButton tone="ghost" onClick={onRestart}>
            Read again
          </BigButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-5 flex items-center gap-4 bg-mist/95 px-5 py-3 backdrop-blur">
        <TimerRing remaining={phase === "pickLast" ? 0 : remaining} />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight">{title}</p>
          <p className="text-sm text-night-soft">
            {phase === "pickLast" ? "Time is up" : phase === "reading" ? (mode === "manual" ? "Tap words read wrong" : waitingForFirstWord ? "Listening… start reading" : "Listening") : "1-minute reading check"}
          </p>
        </div>
        {phase === "reading" && mode !== "manual" ? <span className="pulse-dot ml-auto h-3 w-3 flex-none rounded-full bg-candy" aria-hidden="true" /> : null}
      </div>

      {phase === "ready" ? (
        <>
          <div className="flex gap-1 rounded-full bg-white p-1" role="radiogroup" aria-label="How to score">
            {MODES.filter((m) => m.mode !== "live" || supported).map((m) => (
              <button
                key={m.mode}
                type="button"
                role="radio"
                aria-checked={m.mode === mode}
                onClick={() => onMode(m.mode)}
                className={`relative min-h-11 flex-1 rounded-full px-2 text-[13px] font-semibold ${m.mode === mode ? "text-white" : "text-night-soft"}`}
              >
                {m.mode === mode ? <motion.span layoutId="reading-mode" className="absolute inset-0 rounded-full bg-night" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[15px] leading-snug text-night-soft">
            {mode === "manual"
              ? `Press start when ${kidName} begins. Tap any word read wrong or skipped. When the minute ends, tap the last word read.`
              : mode === "demo"
                ? "A scripted reader, not a real child. Use it to see how the check works."
                : `Press start, then ${kidName} reads the story out loud. Don’t help with words. The minute starts with the first word.`}
          </p>
        </>
      ) : null}

      {phase === "pickLast" ? (
        <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} role="status" className="rounded-3xl bg-lilac px-5 py-4 font-semibold">
          Tap the last word {kidName} read.
        </motion.p>
      ) : null}

      {micProblem ? (
        <div role="status" className="rounded-3xl bg-peach/40 px-5 py-4">
          <p className="text-sm font-medium">
            {speech.error === "microphone"
              ? "The microphone is blocked. Allow it in the browser, or mark the reading yourself."
              : speech.error
                ? "Listening stopped working. You can mark the reading yourself instead."
                : `We can’t hear any words yet. Is ${kidName} reading out loud, close to the phone?`}
          </p>
          <button type="button" onClick={() => onMode("manual")} className="mt-3 min-h-11 rounded-full bg-night px-5 text-sm font-semibold text-white">
            I’ll mark it myself
          </button>
        </div>
      ) : null}

      <div className="rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]">
        <PassageView
          passage={passage}
          words={mode === "manual" ? undefined : alignment.words}
          lastAttempted={mode === "manual" ? -1 : alignment.lastAttempted}
          mode={mode === "manual" ? "readingWithMistakes" : "reading"}
          onTap={mode === "manual" && phase !== "ready" ? (phase === "pickLast" ? pickLast : toggleMark) : undefined}
          tapped={mode === "manual" ? marks : undefined}
          showNext={mode !== "manual" && phase === "reading"}
        />
      </div>

      {phase !== "pickLast" ? (
        <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-mist from-70% to-transparent px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6">
          {phase === "ready" ? <BigButton onClick={begin}>Start</BigButton> : <BigButton tone="light" onClick={() => finish(Math.min(elapsed, TIME_LIMIT))}>Stop</BigButton>}
        </div>
      ) : null}
    </div>
  );
}
