"use client";

import { useEffect, useRef } from "react";
import type { AlignedWord } from "@/lib/reading/align";
import type { PassageWord } from "@/lib/reading/text";
import { SyllableWord } from "@/components/syllable-word";

export type PassageViewMode =
  /** While reading: words already read look read, the next word gets the marker. */
  | "reading"
  /** While reading, for a watching parent: misread and skipped words show as they happen. */
  | "readingWithMistakes"
  /** After reading: every result is shown and words can be tapped to flip right/wrong. */
  | "review";

type Props = {
  passage: PassageWord[];
  words?: AlignedWord[];
  lastAttempted?: number;
  mode: PassageViewMode;
  onTap?: (index: number) => void;
  /** Indices to show as tapped (manual mode, before there is an alignment). */
  tapped?: ReadonlySet<number>;
  /** Mark the next word to read; off when the app can't know where the reader is. */
  showNext?: boolean;
  /** Show words split into syllables (practice only: it changes the task, so never in a check). */
  syllables?: boolean;
  /** Review only: words the speech service wasn't sure about, counted right unless tapped. */
  unsure?: ReadonlySet<number>;
};

export function PassageView({ passage, words, lastAttempted = -1, mode, onTap, tapped, showNext = true, syllables = false, unsure }: Props) {
  const current = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    current.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lastAttempted]);

  return (
    <p className="font-read text-[1.35rem] leading-[2.4] tracking-wide text-ink sm:text-2xl sm:leading-[2.5]">
      {passage.map((w, i) => {
        const status = words?.[i]?.status ?? (i <= lastAttempted ? "correct" : "unreached");
        const isNext = showNext && i === lastAttempted + 1 && mode !== "review";
        const showMistakes = mode !== "reading";
        const lenient = mode === "review" && status === "correct" && words?.[i]?.lenient;
        const isUnsure = mode === "review" && status === "correct" && !!unsure?.has(i);
        let marked = true;
        let cls = "rounded-md px-0.5 transition-colors ";
        if (tapped?.has(i)) cls += "bg-bad-soft text-bad underline decoration-bad decoration-2 ";
        else if (isUnsure) cls += "bg-peach/60 text-ink underline decoration-dotted decoration-2 underline-offset-[6px] ";
        else if (status === "misread" && showMistakes) cls += "bg-bad-soft text-bad underline decoration-bad decoration-2 ";
        else if (status === "skipped" && showMistakes) cls += "text-ink-faint line-through decoration-bad decoration-2 ";
        else {
          marked = false;
          if (status === "unreached") cls += mode === "review" ? "text-ink-faint " : "text-ink ";
          else cls += mode === "review" ? "text-ink " : "text-ink-soft ";
        }
        if (lenient) cls += "underline decoration-ink-faint decoration-dotted decoration-2 underline-offset-[6px] ";
        if (isNext) cls += "marker text-ink ";

        const heard = words?.[i]?.heard;
        const label =
          status === "misread"
            ? heard
              ? `${w.display}, heard as ${heard}`
              : `${w.display}, marked wrong`
            : status === "skipped"
              ? `${w.display}, skipped`
              : isUnsure
                ? `${w.display}, not sure: counted as read, tap if it was wrong`
                : lenient
                  ? `${w.display}, a name, counted as read`
                  : w.display;

        const content = (
          <>
            {syllables ? <SyllableWord display={w.display} /> : w.display}
            {mode === "review" && status === "misread" && heard ? (
              <span className="ml-1 align-super font-sans text-xs font-semibold text-bad">{heard}</span>
            ) : null}
          </>
        );

        return (
          <span key={i} ref={isNext ? current : undefined}>
            {onTap && (mode === "review" ? i <= lastAttempted : true) ? (
              <button type="button" onClick={() => onTap(i)} aria-label={label} className={`${cls} cursor-pointer ${marked ? "" : "hover:bg-sun-soft"}`}>
                {content}
              </button>
            ) : (
              <span className={cls}>{content}</span>
            )}{" "}
          </span>
        );
      })}
    </p>
  );
}
