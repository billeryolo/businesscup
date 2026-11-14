import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { makeWordRound, WORD_ROUND } from "./big-word";

describe("big word round", () => {
  it("gives every part of the word plus one piece that does not belong", () => {
    for (const grade of [-1, 0, 1, 2, 3, 4] as Grade[]) {
      for (let run = 0; run < 50; run++) {
        const round = makeWordRound(grade);
        expect(new Set(round.map((i) => i.word)).size).toBe(WORD_ROUND);
        for (const item of round) {
          expect(item.parts.join("")).toBe(item.word);
          expect(item.tiles.length).toBe(item.parts.length + 1);
          const extra = [...item.tiles];
          for (const part of item.parts) extra.splice(extra.indexOf(part), 1);
          expect(item.parts).not.toContain(extra[0]);
        }
      }
    }
  });

  it("keeps words to two parts up to grade 1 and longer after", () => {
    expect(makeWordRound(1).every((i) => i.parts.length === 2)).toBe(true);
    expect(makeWordRound(3).every((i) => i.parts.length >= 3)).toBe(true);
  });
});
