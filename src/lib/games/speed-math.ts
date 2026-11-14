// Speed math: a round of ten quick facts at the child's level, each with three answers to tap.
// The facts come from the same generator as the 1-minute math check, so game and check agree.

import { makeQuickItems, shuffled } from "@/lib/checks/quick";
import type { Grade } from "@/lib/store/family";

export type MathItem = {
  prompt: string;
  answer: number;
  /** The answer and two near misses, in random order. */
  choices: number[];
  /** For the youngest: the two numbers as dots to count. */
  dots: [number, number] | null;
};

export const ROUND_SIZE = 10;

export function makeRound(grade: Grade, rand: () => number = Math.random, count = ROUND_SIZE): MathItem[] {
  return makeQuickItems("math", grade, rand, count).map((q) => {
    const answer = Number(q.answer);
    const near = [answer - 1, answer + 1, answer - 2, answer + 2, ...(answer > 10 ? [answer - 10, answer + 10] : [])].filter((n) => n >= 0);
    const wrong = shuffled(near, rand).slice(0, 2);
    const parts = q.prompt.split(" + ").map(Number);
    return { prompt: q.prompt, answer, choices: shuffled([answer, ...wrong], rand), dots: grade <= 0 && parts.length === 2 ? [parts[0], parts[1]] : null };
  });
}
