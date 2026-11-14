import type { AlignedWord } from "./align";

export type ReadingScore = {
  /** Passage words from the start through the last one attempted. */
  attempted: number;
  correct: number;
  errors: number;
  /** Words correct per minute. */
  wcpm: number;
  /** Share of attempted words read correctly, 0–1. */
  accuracy: number;
  /** Seconds of reading the score is based on (at most the time limit). */
  seconds: number;
};

/**
 * A parent tapping a word flips its result: a word the recognizer accepted becomes misread, and
 * a misread or skipped word becomes correct. Only words the child attempted can be flipped.
 */
export function applyParentMarks(words: AlignedWord[], lastAttempted: number, flipped: ReadonlySet<number>): AlignedWord[] {
  return words.map((w) => {
    if (!flipped.has(w.index) || w.index > lastAttempted) return w;
    if (w.status === "correct") return { index: w.index, t: w.t, status: "misread" };
    if (w.status === "misread" || w.status === "skipped") return { index: w.index, t: w.t, status: "correct" };
    return w;
  });
}

export function scoreReading(words: AlignedWord[], lastAttempted: number, seconds: number): ReadingScore {
  const attempted = lastAttempted + 1;
  let errors = 0;
  for (let i = 0; i < attempted; i++) {
    if (words[i].status === "misread" || words[i].status === "skipped") errors++;
  }
  const correct = attempted - errors;
  const wcpm = seconds > 0 ? Math.round((correct * 60) / seconds) : 0;
  return { attempted, correct, errors, wcpm, accuracy: attempted ? correct / attempted : 0, seconds };
}

/** Too little reading to compare with the norms; ask for another try. */
export function isTooShort(score: ReadingScore): boolean {
  return score.seconds < 15 || score.attempted < 10;
}
