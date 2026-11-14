"use client";

import { type ReactNode, useEffect } from "react";
import { syllabify } from "@/lib/reading/syllables";
import type { PassageWord } from "@/lib/reading/text";
import { SyllableWord } from "@/components/syllable-word";

type Props = {
  passage: PassageWord[];
  position: number;
  syllables: boolean;
  listening: boolean;
  onGo: (position: number) => void;
  onToggleSyllables: () => void;
  onExit: () => void;
  /** Shown above the buttons, e.g. a microphone problem. */
  notice?: ReactNode;
};

const bare = (display: string) => display.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** One word fills the screen. Tap, the arrow keys or the reader's voice move on. */
export function BigWord({ passage, position, syllables, listening, onGo, onToggleSyllables, onExit, notice }: Props) {
  const word = passage[Math.min(position, passage.length - 1)];
  const text = bare(word.display) || word.display;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onGo(position + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onGo(position - 1);
      } else if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [position, onGo, onExit]);

  // Size the word to fill the screen on one line; only long words split onto two lines, and then
  // only between syllables.
  const parts = syllables ? syllabify(text) : [text];
  const oneLine = text.length + (parts.length - 1) * 0.7;
  const wrap = parts.length > 1 && oneLine > 9;
  // Two lines: half the word plus room for the dots that end each line.
  const length = wrap ? Math.max(Math.max(...parts.map((p) => p.length)) + 1, oneLine / 2 + 1.5) : oneLine;
  const fontSize = `min(${(150 / Math.max(length, 3)).toFixed(1)}vw, 34vh, 15rem)`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="One word at a time">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={onExit} className="min-h-11 rounded-xl px-3 font-semibold text-ink-soft hover:bg-line hover:text-ink">
          Done
        </button>
        <p className="font-mono text-sm tabular-nums text-ink-soft">
          {Math.min(position + 1, passage.length)} / {passage.length}
        </p>
        <button
          type="button"
          onClick={onToggleSyllables}
          aria-pressed={syllables}
          className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold ${syllables ? "border-brand bg-brand-soft text-brand-deep" : "border-line text-ink-soft"}`}
        >
          syl·la·bles
        </button>
      </div>
      <div className="h-1.5 bg-line" aria-hidden="true">
        <div className="h-full bg-brand transition-[width]" style={{ width: `${(position / passage.length) * 100}%` }} />
      </div>

      <button
        type="button"
        onClick={() => onGo(position + 1)}
        aria-label={`${text}. Tap for the next word.`}
        className="flex flex-1 items-center justify-center overflow-hidden px-4"
      >
        <span key={position} className="word-in max-w-full text-center font-read leading-[1.15] font-medium tracking-wide text-ink" style={{ fontSize }}>
          {syllables ? <SyllableWord display={text} className={`inline-flex justify-center ${wrap ? "flex-wrap" : "whitespace-nowrap"}`} /> : text}
        </span>
      </button>

      <div className="flex flex-col gap-3 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {notice}
        <p className="flex min-h-6 items-center justify-center gap-2 text-sm text-ink-soft" aria-live="polite">
          {listening ? (
            <>
              <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-bad" aria-hidden="true" /> Listening: read the word out loud
            </>
          ) : (
            "Read the word, then tap it or press Next"
          )}
        </p>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <button
            type="button"
            onClick={() => onGo(position - 1)}
            disabled={position === 0}
            className="min-h-16 rounded-2xl border-2 border-line bg-sheet text-lg font-semibold disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onGo(position + 1)}
            className="min-h-16 rounded-2xl bg-brand text-lg font-semibold text-white hover:bg-brand-deep"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
