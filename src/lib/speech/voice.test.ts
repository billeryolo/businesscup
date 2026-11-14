import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeWordRound } from "@/lib/games/big-word";
import { letterLine, makeLetterRound } from "@/lib/games/hear-a-letter";
import clips from "./clips.json";

const CLIPS = clips as Record<string, string>;
const rand = () => 0.42;

// Every line the games always say should play from a pre-made clip, not wait for the live voice.
// If this fails after changing a word list: python speech/make_clips.py
describe("pre-made voice clips", () => {
  const letters = makeLetterRound(0, Math.random, 500);
  const lines = new Set<string>([
    ...letters.map(letterLine),
    ...letters.map((i) => `Yes! ${i.letter}!`),
    ...makeWordRound(0, rand, 500).map((w) => w.word),
    ...makeWordRound(4, rand, 500).map((w) => w.word),
  ]);

  it("covers every letter line, cheer and Big word", () => {
    const missing = [...lines].filter((l) => !(l in CLIPS));
    expect(missing).toEqual([]);
    expect(lines.size).toBeGreaterThan(100);
  });

  it("points at files that exist in public/", () => {
    const absent = Object.values(CLIPS).filter((p) => !existsSync(join(process.cwd(), "public", p)));
    expect(absent).toEqual([]);
    expect(existsSync(join(process.cwd(), "public", "audio", "silence.mp3"))).toBe(true);
  });
});
