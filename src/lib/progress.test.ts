import { describe, expect, it } from "vitest";
import { progressFor } from "./progress";
import { demoChecks } from "./store/demo-checks";

// Saturday 14 November 2026: fall of the school year.
const NOW = new Date(2026, 10, 14, 21, 0);
const checks = demoChecks(NOW, { mia: "mia", leo: "leo" });

describe("demo family history", () => {
  it("is newest first and belongs to Mia and Leo", () => {
    expect(checks.map((c) => c.at)).toEqual([...checks.map((c) => c.at)].sort().reverse());
    expect(new Set(checks.map((c) => c.kidId))).toEqual(new Set(["mia", "leo"]));
  });

  it("scores Mia's reading against the grade 2 fall norms", () => {
    const reading = checks.filter((c) => c.kind === "reading").reverse();
    expect(reading.map((c) => c.score)).toEqual([36, 39, 41, 47]);
    expect(reading.every((c) => c.target === 50)).toBe(true); // fall median
    expect(reading.map((c) => c.verdict)).toEqual(["practice", "practice", "practice", "onTrack"]);
  });

  it("uses the published math goal and the Pre-K letters goal", () => {
    expect(checks.find((c) => c.kind === "math")).toMatchObject({ target: 25, verdict: "practice" }); // Rocket Math, grade 2 fall
    expect(checks.find((c) => c.kind === "letters")).toMatchObject({ target: 13 });
  });
});

describe("progressFor", () => {
  it("summarises growth and projects the current pace", () => {
    const p = progressFor(checks.filter((c) => c.kidId === "mia"), "reading");
    expect(p.points.map((x) => x.score)).toEqual([36, 39, 41, 47]);
    expect(p.summary).toBe("+11 words a minute in 3 weeks");
    expect(p.target).toBe(50);
    expect(p.projection).toHaveLength(2);
    expect(p.projection![1].score).toBeGreaterThan(47);
  });

  it("has no summary or projection with a single check", () => {
    const p = progressFor([checks[0]], checks[0].kind);
    expect(p.points).toHaveLength(1);
    expect(p.summary).toBeNull();
    expect(p.projection).toBeNull();
  });
});
