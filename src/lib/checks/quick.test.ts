import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { checksFor, makeQuickItems, quickLevel, quickScore } from "./quick";

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

  it("uses published goals where they exist, by time of the school year", () => {
    const nov = new Date(2026, 10, 14);
    const jan = new Date(2027, 0, 20);
    expect(quickLevel("letters", 0, nov)).toMatchObject({ goal: 25, source: "DIBELS 8" });
    expect(quickLevel("letters", 0, jan)).toMatchObject({ goal: 37, source: "DIBELS 8" });
    expect(quickLevel("math", 1, nov)).toMatchObject({ goal: 12, source: "Rocket Math" });
    expect(quickLevel("math", 2, jan)).toMatchObject({ goal: 21, source: "Rocket Math" });
    expect(quickLevel("math", 4, nov)).toMatchObject({ goal: 35, source: "Rocket Math" });
  });

  it("keeps the app's own goal where nothing is published", () => {
    expect(quickLevel("letters", -1)).toMatchObject({ goal: 13, source: null });
    expect(quickLevel("math", 0)).toMatchObject({ goal: 8, source: null });
  });

  it("scales an early stop to a full minute", () => {
    expect(quickScore(12, 60)).toBe(12);
    expect(quickScore(6, 30)).toBe(12);
    expect(quickScore(3, 0)).toBe(0);
  });
});
