// Aligns what the speech recognizer heard with the passage, the way a teacher scores a
// one-minute reading: skipped and misread words are errors, extra or repeated words are ignored,
// and words after the last one attempted are simply "not reached".

import { type PassageWord, wordsMatch } from "./text";

export type SpokenWord = {
  norm: string;
  /** Seconds since the reading started, when known. */
  t?: number;
};

export type WordStatus = "correct" | "misread" | "skipped" | "unreached";

export type AlignedWord = {
  index: number;
  status: WordStatus;
  /** What was heard instead, for misread words and names. */
  heard?: string;
  /** When the word was heard, for correct and misread words. */
  t?: number;
  /** A name counted as read although the recognizer heard it differently or not at all. */
  lenient?: boolean;
};

export type Alignment = {
  words: AlignedWord[];
  /** Extra spoken words that match nothing in the passage (repeats, the title, chatter). */
  inserted: SpokenWord[];
  /** Index of the last passage word the child attempted, or -1. */
  lastAttempted: number;
};

type Step = "match" | "sub" | "skip" | "insert" | "joinSpoken" | "joinPassage" | "name1" | "name2" | "name3" | "nameSkip";

// Fewest errors first; among equally good alignments, the one with the most matched words.
const ERROR = 1000;
const MATCH = -1;
/** A name heard as something else, or as up to this many words ("Kai" → "k i"), still counts. */
const NAME_SPAN = 3;

/**
 * Edit-distance alignment of the spoken words against the passage, with a free end on the
 * passage side (the child doesn't have to finish). Two spoken words may join into one passage
 * word ("sun flower" → "sunflower") and two passage words into one spoken word.
 */
export function align(passage: PassageWord[], spoken: SpokenWord[]): Alignment {
  const n = passage.length;
  const m = spoken.length;
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity));
  const step: (Step | null)[][] = Array.from({ length: n + 1 }, () => new Array<Step | null>(m + 1).fill(null));

  cost[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue;
      let best = Infinity;
      let how: Step | null = null;
      const consider = (value: number, s: Step) => {
        if (value < best) {
          best = value;
          how = s;
        }
      };
      if (i > 0 && j > 0) {
        const same = wordsMatch(passage[i - 1].norm, spoken[j - 1].norm);
        consider(cost[i - 1][j - 1] + (same ? MATCH : ERROR), same ? "match" : "sub");
      }
      if (i > 0 && j > 1 && passage[i - 1].norm === spoken[j - 2].norm + spoken[j - 1].norm) {
        consider(cost[i - 1][j - 2] + MATCH, "joinSpoken");
      }
      if (i > 1 && j > 0 && passage[i - 2].norm + passage[i - 1].norm === spoken[j - 1].norm) {
        consider(cost[i - 2][j - 1] + 2 * MATCH, "joinPassage");
      }
      if (i > 0 && passage[i - 1].name) {
        // Names cost nothing whatever was heard, but an exact match still scores better.
        for (let k = 1; k <= Math.min(NAME_SPAN, j); k++) consider(cost[i - 1][j - k], `name${k}` as Step);
        consider(cost[i - 1][j], "nameSkip");
      }
      if (i > 0) consider(cost[i - 1][j] + ERROR, "skip");
      if (j > 0) consider(cost[i][j - 1] + ERROR, "insert");
      cost[i][j] = best;
      step[i][j] = how;
    }
  }

  // Free end: the child may stop anywhere. On ties prefer the later end, so a last word that was
  // misread counts as misread rather than as an extra spoken word.
  let end = 0;
  for (let i = 1; i <= n; i++) if (cost[i][m] <= cost[end][m]) end = i;

  const words: AlignedWord[] = passage.map((_, index) => ({ index, status: "unreached" }));
  const inserted: SpokenWord[] = [];
  let i = end;
  let j = m;
  while (i > 0 || j > 0) {
    const s = step[i][j];
    if (s === "match") {
      words[i - 1] = { index: i - 1, status: "correct", t: spoken[j - 1].t };
      i--; j--;
    } else if (s === "sub") {
      words[i - 1] = { index: i - 1, status: "misread", heard: spoken[j - 1].norm, t: spoken[j - 1].t };
      i--; j--;
    } else if (s === "joinSpoken") {
      words[i - 1] = { index: i - 1, status: "correct", t: spoken[j - 2].t };
      i--; j -= 2;
    } else if (s === "joinPassage") {
      words[i - 1] = { index: i - 1, status: "correct", t: spoken[j - 1].t };
      words[i - 2] = { index: i - 2, status: "correct", t: spoken[j - 1].t };
      i -= 2; j--;
    } else if (s === "name1" || s === "name2" || s === "name3") {
      const k = Number(s.slice(4));
      const heard = spoken.slice(j - k, j);
      words[i - 1] = { index: i - 1, status: "correct", lenient: true, heard: heard.map((w) => w.norm).join(" "), t: heard[0].t };
      i--; j -= k;
    } else if (s === "nameSkip") {
      words[i - 1] = { index: i - 1, status: "correct", lenient: true };
      i--;
    } else if (s === "skip") {
      words[i - 1] = { index: i - 1, status: "skipped" };
      i--;
    } else {
      inserted.unshift(spoken[j - 1]);
      j--;
    }
  }

  // A name nobody was heard saying at the very end was not reached, not read.
  let last = end - 1;
  while (last >= 0 && words[last].lenient && words[last].heard === undefined) {
    words[last] = { index: last, status: "unreached" };
    last--;
  }

  return { words, inserted, lastAttempted: last };
}
