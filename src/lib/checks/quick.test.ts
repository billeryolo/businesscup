import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { checksFor, makeQuickItems, quickScore } from "./quick";

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

// Evaluates "7 + 5", "12 − 4" and "3 × 6".
function solve(prompt: string): number {
  const [a, op, b] = prompt.split(" ");
  return op === "+" ? Number(a) + Number(b) : op === "−" ? Number(a) - Number(b) : Number(a) * Number(b);
}

describe("quick checks", () => {
  it("offers letters before school and reading from grade 1", () => {
    expect(checksFor(-1)).toEqual(["letters"]);
    expect(checksFor(0)).toEqual(["letters", "math"]);
    expect(checksFor(3)).toEqual(["reading", "math"]);
  });

  it.each([-1, 0, 1, 2, 3, 4] as Grade[])("makes correct math facts within range for grade %i", (grade) => {
    const items = makeQuickItems("math", grade, seeded(grade + 5), 200);
    const top = grade <= 0 ? 5 : grade === 1 ? 10 : grade === 2 ? 20 : 100;
    items.forEach((item, i) => {
      expect(solve(item.prompt)).toBe(Number(item.answer));
      expect(Number(item.answer)).toBeGreaterThanOrEqual(1);
      expect(Number(item.answer)).toBeLessThanOrEqual(top);
      expect(item.prompt.split(" ").filter((p) => /\d/.test(p)).every((n) => Number(n) <= top)).toBe(true);
      if (i) expect(item.prompt).not.toBe(items[i - 1].prompt);
    });
  });

  it("shows only capitals to Pre-K and never repeats a letter back to back", () => {
    const preK = makeQuickItems("letters", -1, seeded(1));
    expect(preK.every((i) => /^[A-Z]$/.test(i.prompt))).toBe(true);
    const k = makeQuickItems("letters", 0, seeded(2));
    expect(k.some((i) => /^[a-z]$/.test(i.prompt))).toBe(true);
    k.forEach((item, i) => i && expect(item.prompt).not.toBe(k[i - 1].prompt));
  });

  it("scales an early stop to a full minute", () => {
    expect(quickScore(12, 60)).toBe(12);
    expect(quickScore(6, 30)).toBe(12);
    expect(quickScore(3, 0)).toBe(0);
  });
});
