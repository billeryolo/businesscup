import { describe, expect, it } from "vitest";
import type { CheckRecord } from "@/lib/store/checks";
import { changeText, curve, place, trendFor } from "./trend";

const check = (score: number, day: number, kind: CheckRecord["kind"] = "reading"): CheckRecord => ({
  id: `${kind}-${day}`, kidId: "k", kind, at: `2026-11-${String(day).padStart(2, "0")}T10:00:00Z`, score, accuracy: 0.9, target: 72, verdict: "practice",
});
// Newest first, like the store.
const checks = [check(66, 14), check(20, 13, "math"), check(61, 7), check(55, 1)];
const box = { width: 320, height: 160, left: 10, right: 10, top: 10, bottom: 20 };

describe("progress trend", () => {
  it("takes one kind, oldest first", () => {
    const trend = trendFor(checks, "reading")!;
    expect(trend.points.map((p) => p.score)).toEqual([55, 61, 66]);
    expect(trend).toMatchObject({ change: 11, best: 66, target: 72 });
    expect(changeText(trend)).toBe("Up 11 over 3 checks");
    expect(trendFor(checks, "letters")).toBeNull();
    expect(changeText(trendFor(checks, "math")!)).toContain("First check");
  });

  it("keeps only the last eight", () => {
    const many = Array.from({ length: 12 }, (_, i) => check(40 + i, 12 - i)).map((c, i) => ({ ...c, score: 60 - i }));
    const trend = trendFor(many, "reading")!;
    expect(trend.points.length).toBe(8);
    expect(trend.latest.score).toBe(60);
  });

  it("places dots inside the box, higher scores higher up", () => {
    const { dots, goalY, floor } = place([55, 61, 66], 72, box);
    expect(dots[0].x).toBe(10);
    expect(dots[2].x).toBe(310);
    expect(dots[0].y).toBeGreaterThan(dots[2].y);
    expect(goalY).toBeLessThan(dots[2].y);
    expect(goalY).toBeGreaterThan(box.top);
    expect(floor).toBe(140);
    expect(place([30], 15, box).dots[0].x).toBe(160);
  });

  it("draws one curve segment per step", () => {
    const d = curve(place([55, 61, 66], 72, box).dots);
    expect(d.startsWith("M10 ")).toBe(true);
    expect(d.match(/C/g)?.length).toBe(2);
    expect(curve([])).toBe("");
  });
});
