// What gets stored for a reading: scores and one letter per attempted word. No audio, no transcript.

import type { AlignedWord } from "./align";
import type { Assessment, Verdict } from "./assess";
import { type Season, seasonFor } from "./norms";
import type { PatternId } from "./patterns";

export type ReadingMode = "live" | "manual" | "demo";

export type ReadingRecord = {
  passageId: string;
  grade: number;
  season: Season;
  mode: ReadingMode;
  seconds: number;
  attempted: number;
  errors: number;
  wcpm: number;
  accuracy: number;
  verdict: Verdict;
  band: string;
  patterns: PatternId[];
  /** c = correct, m = misread, s = skipped, one letter per attempted word. */
  wordStatuses: string;
  readAt: string;
};

const LETTER = { correct: "c", misread: "m", skipped: "s" } as const;

export function encodeStatuses(words: AlignedWord[], lastAttempted: number): string {
  return words
    .slice(0, lastAttempted + 1)
    .map((w) => (w.status === "unreached" ? "" : LETTER[w.status]))
    .join("");
}

export function toRecord(a: Assessment, passageId: string, mode: ReadingMode, readAt: Date): ReadingRecord {
  return {
    passageId,
    grade: a.grade,
    season: seasonFor(readAt),
    mode,
    seconds: Math.round(a.score.seconds * 10) / 10,
    attempted: a.score.attempted,
    errors: a.score.errors,
    wcpm: a.score.wcpm,
    accuracy: Math.round(a.score.accuracy * 1000) / 1000,
    verdict: a.verdict,
    band: a.band,
    patterns: a.patterns.map((p) => p.id),
    wordStatuses: encodeStatuses(a.alignment.words, a.alignment.lastAttempted),
    readAt: readAt.toISOString(),
  };
}
