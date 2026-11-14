// Mistake patterns found with simple rules on the alignment. They describe what happened during
// this reading; they are not a diagnosis.

import type { AlignedWord } from "./align";
import type { PassageWord } from "./text";

export type PatternId = "decoding" | "firstLetterGuess" | "longPauses" | "losesPlace" | "skipsSmallWords" | "accurateButSlow";

export type Pattern = {
  id: PatternId;
  /** Up to three examples: the passage word and, for misreads, what was heard. */
  examples: { word: string; heard?: string }[];
};

export type PatternInput = {
  passage: PassageWord[];
  words: AlignedWord[];
  lastAttempted: number;
  accuracy: number;
  needsFluencyBuilding: boolean;
};

const PAUSE_SECONDS = 3;
const LINE_SKIP_RUN = 5;
const SMALL_WORD_LENGTH = 3;

export function findPatterns({ passage, words, lastAttempted, accuracy, needsFluencyBuilding }: PatternInput): Pattern[] {
  const attempted = words.slice(0, lastAttempted + 1);
  const shown = (i: number) => passage[i].display.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  const found: Pattern[] = [];

  const misreads = attempted.filter((w) => w.status === "misread");
  const guesses = misreads.filter((w) => w.heard && w.heard[0] === passage[w.index].norm[0]);
  const guessing = guesses.length >= 2 && guesses.length >= misreads.length * 0.4;
  const example = (w: AlignedWord) => ({ word: shown(w.index), heard: w.heard });

  if (accuracy < 0.95 && misreads.length >= 3) {
    // Don't repeat the first-letter examples under both patterns.
    const others = guessing ? misreads.filter((w) => !guesses.includes(w)) : misreads;
    found.push({ id: "decoding", examples: others.slice(0, 3).map(example) });
  }
  if (guessing) found.push({ id: "firstLetterGuess", examples: guesses.slice(0, 3).map(example) });

  const paused: AlignedWord[] = [];
  let previousT: number | undefined;
  for (const w of attempted) {
    if (w.t === undefined) continue;
    if (previousT !== undefined && w.t - previousT >= PAUSE_SECONDS) paused.push(w);
    previousT = w.t;
  }
  if (paused.length >= 2) {
    found.push({ id: "longPauses", examples: paused.slice(0, 3).map((w) => ({ word: shown(w.index) })) });
  }

  // Runs of skipped words: long runs mean a lost line, short skipped words mean small words.
  const runs: AlignedWord[][] = [];
  let run: AlignedWord[] = [];
  for (const w of attempted) {
    if (w.status === "skipped") run.push(w);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);

  const lineSkips = runs.filter((r) => r.length >= LINE_SKIP_RUN);
  if (lineSkips.length) {
    found.push({ id: "losesPlace", examples: lineSkips.slice(0, 3).map((r) => ({ word: shown(r[0].index) })) });
  }

  const smallSkips = runs
    .filter((r) => r.length < LINE_SKIP_RUN)
    .flat()
    .filter((w) => passage[w.index].norm.length <= SMALL_WORD_LENGTH);
  if (smallSkips.length >= 2) {
    found.push({ id: "skipsSmallWords", examples: smallSkips.slice(0, 3).map((w) => ({ word: shown(w.index) })) });
  }

  if (accuracy >= 0.95 && needsFluencyBuilding) found.push({ id: "accurateButSlow", examples: [] });

  return found;
}

export const PATTERN_COPY: Record<PatternId, { title: string; seen: string; tip: string }> = {
  decoding: {
    title: "Sounding out words is the hard part",
    seen: "Several words were read as different words.",
    tip: "Practice sounding out short words letter by letter, then blending them. Re-read the same short passage a few times.",
  },
  firstLetterGuess: {
    title: "Guesses from the first letter",
    seen: "Some words were replaced by other words that start with the same letter.",
    tip: "Cover the word and reveal it left to right, saying each sound. Praise slowing down more than speed.",
  },
  longPauses: {
    title: "Long stops before some words",
    seen: "There were pauses of three seconds or more before some words.",
    tip: "Practice the tricky words from today's passage on cards before reading it again.",
  },
  losesPlace: {
    title: "Loses the place on the page",
    seen: "A whole run of words was skipped, which usually means a line was skipped.",
    tip: "Read with a finger or a bookmark under the line.",
  },
  skipsSmallWords: {
    title: "Skips small words",
    seen: "Short words like \"the\" or \"and\" were left out.",
    tip: "Echo reading: you read a sentence, then your child reads the same sentence pointing at each word.",
  },
  accurateButSlow: {
    title: "Accurate, but slow",
    seen: "Almost every word was right, but the pace was below what is typical for the grade.",
    tip: "Repeated reading: read the same short passage three times in a row and watch the time drop.",
  },
};
