// The two short checks for children who are not reading passages yet (and for math at any age):
// facts answered in a minute, and letters named in a minute.
//
// There is no single national norm for either, so the score is compared with a practice goal
// chosen for the app, and the screens say so. Only the reading check uses published norms.

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

export function quickLevel(kind: QuickKind, grade: Grade): { label: string; goal: number } {
  if (kind === "letters") return grade === -1 ? { label: "capital letters", goal: 13 } : { label: "capital and small letters", goal: 26 };
  if (grade <= 0) return { label: "adding up to 5", goal: 8 };
  if (grade === 1) return { label: "adding up to 10", goal: 10 };
  if (grade === 2) return { label: "adding and taking away up to 20", goal: 15 };
  if (grade === 3) return { label: "times tables: 2, 3, 4, 5 and 10", goal: 15 };
  return { label: "times tables up to 10", goal: 20 };
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

function shuffled<T>(list: T[], rand: Rand): T[] {
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
