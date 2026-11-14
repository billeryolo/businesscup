// The two short checks for children who are not reading passages yet (and for math at any age):
// facts answered in a minute, and letters named in a minute.
//
// Where a published benchmark exists, the goal comes from it and the screens name the source
// (docs/BENCHMARKS.md): DIBELS 8 letter naming for kindergarten, Rocket Math fact fluency for
// grades 1–4. Pre-K letters and kindergarten math have no published per-minute goal, so they keep
// a practice goal chosen for the app, and the screens say so.

import { seasonFor } from "@/lib/reading/norms";
import type { CheckKind } from "@/lib/store/checks";
import type { Grade } from "@/lib/store/family";

export type QuickKind = Exclude<CheckKind, "reading">;
export type QuickItem = { prompt: string; answer: string };

/** Which checks fit the grade: letters before school, reading from grade 1. */
export function checksFor(grade: Grade): CheckKind[] {
  if (grade === -1) return ["letters"];
  if (grade === 0) return ["letters", "math"];
  return ["reading", "math"];
}

export type QuickLevel = {
  label: string;
  /** Per minute, for this grade at this time of the school year. */
  goal: number;
  /** Where the goal comes from, e.g. "DIBELS 8"; null for the app's own practice goal. */
  source: string | null;
};

type BySeason = { fall: number; winter: number; spring: number };

/** DIBELS 8 Letter Naming Fluency, kindergarten, minimum for "core support" (goals updated July 2020). */
const DIBELS_LNF_K: BySeason = { fall: 25, winter: 37, spring: 42 };

/**
 * Rocket Math fact fluency benchmarks (2024), written problems per minute, for the facts each
 * grade's check uses. A check mixing two operations aims at their average.
 */
const ROCKET_MATH: Record<1 | 2 | 3 | 4, BySeason> = {
  1: { fall: 12, winter: 25, spring: 25 }, // addition
  2: { fall: 25, winter: 21, spring: 28 }, // addition, then addition and subtraction mixed
  3: { fall: 30, winter: 30, spring: 30 }, // multiplication
  4: { fall: 35, winter: 35, spring: 35 }, // multiplication
};

export function quickLevel(kind: QuickKind, grade: Grade, date: Date = new Date()): QuickLevel {
  const season = seasonFor(date);
  if (kind === "letters") {
    if (grade === -1) return { label: "capital letters", goal: 13, source: null };
    return { label: "capital and small letters", goal: grade === 0 ? DIBELS_LNF_K[season] : 26, source: grade === 0 ? "DIBELS 8" : null };
  }
  if (grade <= 0) return { label: "adding up to 5", goal: 8, source: null };
  const goal = ROCKET_MATH[grade as 1 | 2 | 3 | 4][season];
  const label = { 1: "adding up to 10", 2: "adding and taking away up to 20", 3: "times tables: 2, 3, 4, 5 and 10", 4: "times tables up to 10" }[grade as 1 | 2 | 3 | 4];
  return { label, goal, source: "Rocket Math" };
}

type Rand = () => number;
const int = (rand: Rand, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

function mathItem(grade: Grade, rand: Rand): QuickItem {
  if (grade <= 1) {
    const top = grade <= 0 ? 5 : 10;
    const a = int(rand, 1, top - 1);
    const b = int(rand, 1, top - a);
    return { prompt: `${a} + ${b}`, answer: String(a + b) };
  }
  if (grade === 2) {
    const a = int(rand, 2, 18);
    const b = int(rand, 1, 20 - a);
    return rand() < 0.5 ? { prompt: `${a} + ${b}`, answer: String(a + b) } : { prompt: `${a + b} − ${b}`, answer: String(a) };
  }
  const a = grade === 3 ? [2, 3, 4, 5, 10][int(rand, 0, 4)] : int(rand, 2, 10);
  const b = int(rand, 2, 10);
  return { prompt: `${a} × ${b}`, answer: String(a * b) };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function shuffled<T>(list: T[], rand: Rand): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = int(rand, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** More items than anyone answers in a minute, never the same one twice in a row. */
export function makeQuickItems(kind: QuickKind, grade: Grade, rand: Rand = Math.random, count = 80): QuickItem[] {
  const items: QuickItem[] = [];
  if (kind === "letters") {
    const pool = grade === -1 ? ALPHABET : [...ALPHABET, ...ALPHABET.map((l) => l.toLowerCase())];
    while (items.length < count) {
      const round = shuffled(pool, rand).map((l) => ({ prompt: l, answer: l }));
      if (items.at(-1)?.prompt === round[0].prompt) round.reverse();
      items.push(...round);
    }
    return items.slice(0, count);
  }
  while (items.length < count) {
    const next = mathItem(grade, rand);
    if (items.at(-1)?.prompt !== next.prompt) items.push(next);
  }
  return items;
}

/** Correct answers per minute; a check stopped early is scaled up to the full minute. */
export function quickScore(correct: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return seconds >= 60 ? correct : Math.round((correct * 60) / seconds);
}

/** Under 15 seconds or 5 answers is too little to say anything. */
export const quickTooShort = (attempted: number, seconds: number) => seconds < 15 || attempted < 5;
