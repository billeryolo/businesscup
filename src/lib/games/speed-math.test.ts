import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { makeRound, ROUND_SIZE } from "./speed-math";

describe("speed math round", () => {
  it("gives ten facts, each with three different answers that include the right one", () => {
    for (const grade of [-1, 0, 1, 2, 3, 4] as Grade[]) {
      for (let run = 0; run < 50; run++) {
        const round = makeRound(grade);
        expect(round.length).toBe(ROUND_SIZE);
        for (const item of round) {
          expect(new Set(item.choices).size).toBe(3);
          expect(item.choices).toContain(item.answer);
          expect(item.choices.every((n) => n >= 0)).toBe(true);
        }
      }
    }
  });

  it("shows dots to count only for the youngest", () => {
    expect(makeRound(-1).every((i) => i.dots && i.dots[0] + i.dots[1] === i.answer)).toBe(true);
    expect(makeRound(2).every((i) => i.dots === null)).toBe(true);
  });
});
