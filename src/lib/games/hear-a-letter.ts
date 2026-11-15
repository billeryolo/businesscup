// Hear a letter: the phone says a letter and a word that starts with it, and the child taps the
// letter. Capitals and three choices for Pre-K; both cases, four choices and look-alikes after.

import { shuffled } from "@/lib/checks/quick";
import type { Grade } from "@/lib/store/family";

export type LetterItem = {
  /** Always the capital, for speaking. */
  letter: string;
  /** As shown on the tiles: capital or small. */
  answer: string;
  word: string;
  choices: string[];
};

export const LETTER_ROUND = 8;

const WORDS: Record<string, string> = {
  A: "apple", B: "ball", C: "cat", D: "dog", E: "egg", F: "fish", G: "goat", H: "hat", I: "igloo", J: "jam", K: "kite", L: "lion", M: "moon",
  N: "nest", O: "octopus", P: "pig", Q: "queen", R: "rabbit", S: "sun", T: "tiger", U: "umbrella", V: "van", W: "water", X: "x-ray", Y: "yo-yo", Z: "zebra",
};
const ALPHABET = Object.keys(WORDS);

/** Letters children mix up, by shape or by sound. */
const LOOK_ALIKE: Record<string, string> = { B: "DP", D: "BP", P: "BQ", Q: "PG", M: "NW", N: "MU", U: "NV", V: "UW", W: "MV", I: "LJ", L: "IT", C: "GO", G: "CQ", E: "F", F: "ET", S: "Z", Z: "S", K: "X", X: "K" };

export function makeLetterRound(grade: Grade, rand: () => number = Math.random, count = LETTER_ROUND): LetterItem[] {
  const options = grade === -1 ? 3 : 4;
  return shuffled(ALPHABET, rand)
    .slice(0, count)
    .map((letter) => {
      const alike = grade === -1 ? [] : shuffled((LOOK_ALIKE[letter] ?? "").split(""), rand).slice(0, 1);
      const others = shuffled(ALPHABET.filter((l) => l !== letter && !alike.includes(l)), rand).slice(0, options - 1 - alike.length);
      const small = grade !== -1 && rand() < 0.5;
      const show = (l: string) => (small ? l.toLowerCase() : l);
      return { letter, answer: show(letter), word: WORDS[letter], choices: shuffled([letter, ...alike, ...others], rand).map(show) };
    });
}

/** What the phone says for a letter. */
// Said once, slowly (the clips are made at a slower speed in speech/make_clips.py).
export const letterLine = (item: LetterItem) => `${item.letter} is for ${item.word}.`;
