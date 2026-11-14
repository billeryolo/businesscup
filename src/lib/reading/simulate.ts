// A scripted reader for tests and the labelled demo recording: it "reads" a passage at a set
// pace and makes a chosen kind of mistake, producing the same timeline a recognizer would.

import type { SpokenWord } from "./align";
import type { PassageWord } from "./text";

export type ReaderProfile = {
  /** Words spoken per minute, mistakes included. */
  wordsPerMinute: number;
  /** Chance each word is misread as another word with the same first letter. */
  guessRate: number;
  /** Chance each short word (3 letters or fewer) is skipped. */
  skipSmallRate: number;
  /** Chance of a 3.5-second pause before a long word (7+ letters). */
  pauseRate: number;
  seed: number;
};

export const DEMO_PROFILES = {
  onTrack: { wordsPerMinute: 115, guessRate: 0.01, skipSmallRate: 0.005, pauseRate: 0, seed: 7 },
  guesser: { wordsPerMinute: 70, guessRate: 0.12, skipSmallRate: 0.04, pauseRate: 0.35, seed: 11 },
} satisfies Record<string, ReaderProfile>;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Everything the reader says within `seconds`, with timestamps. */
export function simulateReading(passage: PassageWord[], profile: ReaderProfile, seconds = 60): SpokenWord[] {
  const random = rng(profile.seed);
  const step = 60 / profile.wordsPerMinute;
  const spoken: SpokenWord[] = [];
  let t = 0.6;
  for (let i = 0; i < passage.length; i++) {
    const target = passage[i].norm;
    if (target.length <= 3 && random() < profile.skipSmallRate) continue;
    if (target.length >= 7 && random() < profile.pauseRate) t += 3.5;
    if (t > seconds) break;
    let said = target;
    if (target.length >= 4 && random() < profile.guessRate) {
      const sameStart = passage.filter((w) => w.norm[0] === target[0] && w.norm !== target && w.norm.length >= 3);
      said = sameStart.length ? sameStart[Math.floor(random() * sameStart.length)].norm : `${target[0]}${target.slice(2)}`;
    }
    spoken.push({ norm: said, t: Math.round(t * 10) / 10 });
    t += step;
  }
  return spoken;
}
