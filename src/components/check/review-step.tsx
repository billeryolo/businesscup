"use client";

import { useState } from "react";
import type { Assessment } from "@/lib/reading/assess";
import { isTooShort } from "@/lib/reading/score";
import type { PassageWord } from "@/lib/reading/text";
import { Button } from "@/components/ui";
import { PassageView } from "./passage-view";

type Props = {
  passage: PassageWord[];
  assessment: Assessment;
  onTap: (index: number) => void;
  onRetry: () => void;
  onNext: () => void;
};

export function ReviewStep({ passage, assessment, onTap, onRetry, onNext }: Props) {
  const { score, alignment } = assessment;
  const tooShort = isTooShort(score);
  const [showAll, setShowAll] = useState(false);
  // The words after the last one read don't need checking; keep a few for context.
  const cut = showAll ? passage.length : Math.min(passage.length, alignment.lastAttempted + 13);
  const hasNames = alignment.words.some((w) => w.lenient && w.index <= alignment.lastAttempted);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Check the scoring</h1>
        <p className="mt-2 text-ink-soft">
          Red words were read as something else, crossed-out words were skipped. If we got a word wrong, tap it to fix it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { value: score.wcpm, label: "words correct per minute" },
          { value: `${Math.round(score.accuracy * 100)}%`, label: "accuracy" },
          { value: score.errors, label: score.errors === 1 ? "mistake" : "mistakes" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border-2 border-line bg-sheet px-2 py-4">
            <p className="font-mono text-3xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-ink-soft sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {tooShort ? (
        <div className="rounded-xl bg-warn-soft px-4 py-3">
          <p className="font-medium">That was too little reading to compare with the norms. Try again and read for the whole minute.</p>
          <Button variant="secondary" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}

      <div className="rounded-2xl border-2 border-line bg-sheet p-5 sm:p-8">
        <PassageView passage={passage.slice(0, cut)} words={alignment.words} lastAttempted={alignment.lastAttempted} mode="review" onTap={onTap} />
        {cut < passage.length ? (
          <button type="button" onClick={() => setShowAll(true)} className="mt-2 min-h-11 text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
            Show the rest of the story
          </button>
        ) : null}
        {hasNames ? (
          <p className="mt-4 border-t-2 border-line pt-4 text-sm text-ink-soft">
            Names with a dotted line count as read even when the app hears them differently, since speech recognition often gets names wrong. Tap one if
            it was really misread.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onNext} disabled={tooShort}>
          See the result
        </Button>
        <Button variant="secondary" onClick={onRetry}>
          Read again
        </Button>
      </div>
    </div>
  );
}
