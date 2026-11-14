"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { align, type SpokenWord } from "@/lib/reading/align";
import { DEMO_PROFILES } from "@/lib/reading/simulate";
import type { PassageWord } from "@/lib/reading/text";
import { useDemoReader } from "@/lib/speech/use-demo-reader";
import { useSpeechRecognition } from "@/lib/speech/use-speech-recognition";
import { Button } from "@/components/ui";
import { PassageView } from "./passage-view";

export const TIME_LIMIT = 60;

export type ReadingMode = "live" | "manual" | "demo";

export type ReadingDone = {
  spoken: SpokenWord[];
  seconds: number;
  /** Words the parent tapped as wrong while listening (manual mode). */
  marks: Set<number>;
};

type Props = {
  passage: PassageWord[];
  title: string;
  childName: string;
  mode: ReadingMode;
  onDone: (result: ReadingDone) => void;
  onSwitchMode: (mode: ReadingMode) => void;
};

type Phase = "ready" | "reading" | "pickLast";

const NOTHING_HEARD: SpokenWord[] = [];

export function ReadingStep({ passage, title, childName, mode, onDone, onSwitchMode }: Props) {
  const speech = useSpeechRecognition();
  const demo = useDemoReader(passage, DEMO_PROFILES.guesser);
  const source = mode === "demo" ? demo : speech;
  const spoken = mode === "manual" ? NOTHING_HEARD : source.words;

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [showMistakes, setShowMistakes] = useState(false);
  const [marks, setMarks] = useState<Set<number>>(() => new Set());
  const [manualSeconds, setManualSeconds] = useState(0);
  /** Seconds since start while no word has been heard yet. */
  const [waited, setWaited] = useState(0);

  const alignment = useMemo(() => align(passage, spoken), [passage, spoken]);
  const latest = useRef({ alignment, spoken });
  useEffect(() => {
    latest.current = { alignment, spoken };
  });

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (tick.current) clearInterval(tick.current);
  }, []);

  const name = childName.trim() || "your child";

  function finish(seconds: number) {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    if (mode === "manual") {
      setManualSeconds(seconds);
      setPhase("pickLast");
      return;
    }
    source.stop();
    onDone({ spoken: latest.current.spoken, seconds, marks: new Set() });
  }

  function begin() {
    setPhase("reading");
    setElapsed(0);
    setWaited(0);
    const startedAt = performance.now();
    if (mode !== "manual") source.start();
    // The minute starts with the first word heard, as in a teacher-run check. In manual mode the
    // parent presses start when the child begins.
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
    const words = passage.slice(0, i + 1).map((w) => ({ norm: w.norm }));
    onDone({ spoken: words, seconds: manualSeconds, marks: new Set([...marks].filter((m) => m <= i)) });
  }

  const remaining = Math.max(0, Math.ceil(TIME_LIMIT - elapsed));
  const waitingForFirstWord = phase === "reading" && mode !== "manual" && spoken.length === 0;
  const hearsNothing = waitingForFirstWord && mode === "live" && waited >= 8 && !speech.error;

  return (
    <div className="flex flex-col gap-5">
      {mode === "demo" ? (
        <p className="rounded-xl bg-sun-soft px-4 py-3 text-sm font-medium text-ink">
          Demo recording: a scripted reader, not a real child. Use it to see how the check works.
        </p>
      ) : null}

      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b-2 border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border-2">
        <div>
          <p className="text-sm text-ink-soft">{title}</p>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            <span className="sr-only">Time left: </span>
            {phase === "pickLast" ? "0:00" : `0:${String(remaining).padStart(2, "0")}`}
          </p>
        </div>
        {phase === "ready" ? (
          <Button onClick={begin}>{mode === "manual" ? "Start the minute" : "Start reading"}</Button>
        ) : phase === "reading" ? (
          <div className="flex items-center gap-3">
            {mode !== "manual" ? (
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-bad" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Listening</span>
              </span>
            ) : null}
            <Button variant="secondary" onClick={() => finish(Math.min(elapsed, TIME_LIMIT))}>
              Stop
            </Button>
          </div>
        ) : null}
      </div>

      {phase === "ready" ? (
        <p className="text-ink-soft">
          {mode === "manual"
            ? `Press start when ${name} begins. Tap any word read wrong or skipped as you listen. When the minute is up, you'll tap the last word read.`
            : `Press start, then ${name} reads the story out loud from the beginning. Don't help with words; just listen. The minute starts with the first word.`}
        </p>
      ) : null}
      {waitingForFirstWord && !hearsNothing ? <p className="text-ink-soft">Listening… start reading from the first word.</p> : null}
      {hearsNothing ? (
        <div role="status" className="rounded-xl bg-warn-soft px-4 py-3 text-ink">
          <p className="font-medium">
            We can&apos;t hear any words yet. Check that {name} is reading out loud, close to the device, and that no other app is using the microphone.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => onSwitchMode("manual")}>
              I&apos;ll score it myself
            </Button>
          </div>
        </div>
      ) : null}
      {phase === "pickLast" ? (
        <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 font-medium text-ink">
          Time is up. Tap the last word {name} read.
        </p>
      ) : null}
      {speech.error && mode === "live" ? (
        <div className="rounded-xl bg-bad-soft px-4 py-3 text-ink">
          <p className="font-medium">
            {speech.error === "microphone"
              ? "The microphone is blocked. Allow it in the browser's address bar, or score the reading yourself."
              : "Speech recognition stopped working. You can score the reading yourself instead."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => onSwitchMode("manual")}>
              I&apos;ll score it myself
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border-2 border-line bg-sheet p-5 sm:p-8">
        <h2 className="mb-4 font-read text-2xl font-semibold">{title}</h2>
        <PassageView
          passage={passage}
          words={mode === "manual" ? undefined : alignment.words}
          lastAttempted={mode === "manual" ? -1 : alignment.lastAttempted}
          mode={mode === "manual" || showMistakes ? "readingWithMistakes" : "reading"}
          onTap={mode === "manual" && phase !== "ready" ? (phase === "pickLast" ? pickLast : toggleMark) : undefined}
          tapped={mode === "manual" ? marks : undefined}
          showNext={mode !== "manual"}
        />
      </div>

      {mode !== "manual" ? (
        <label className="flex items-center gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={showMistakes} onChange={(e) => setShowMistakes(e.target.checked)} />
          Show mistakes while reading (parent view)
        </label>
      ) : null}
    </div>
  );
}
