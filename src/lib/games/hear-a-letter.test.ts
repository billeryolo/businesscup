import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { LETTER_ROUND, makeLetterRound } from "./hear-a-letter";

describe("hear a letter round", () => {
  it("never repeats a letter and always offers the right tile among different ones", () => {
    for (const grade of [-1, 0, 1, 2] as Grade[]) {
      for (let run = 0; run < 50; run++) {
        const round = makeLetterRound(grade);
        expect(new Set(round.map((i) => i.letter)).size).toBe(LETTER_ROUND);
        for (const item of round) {
          expect(item.choices.length).toBe(grade === -1 ? 3 : 4);
          expect(new Set(item.choices).size).toBe(item.choices.length);
          expect(item.choices).toContain(item.answer);
          expect(item.answer.toUpperCase()).toBe(item.letter);
        }
      }
    }
  });

  it("uses only capitals for Pre-K", () => {
    expect(makeLetterRound(-1).every((i) => i.choices.every((c) => c === c.toUpperCase()))).toBe(true);
  });
});
