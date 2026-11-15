import { describe, expect, it } from "vitest";
import { dayKey } from "./roadmap";
import { reportText, teacherReport } from "./report";
import { demoChecks } from "./store/demo-checks";
import type { Kid } from "./store/family";

const NOW = new Date(2026, 10, 14, 20, 0);
const ago = (...d: number[]) => d.map((n) => dayKey(new Date(2026, 10, 14 - n)));
const checks = demoChecks(NOW, { mia: "mia", leo: "leo" });
const mia: Kid = { id: "mia", name: "Mia", grade: 2, avatar: "lion", stars: 46, streakDays: 3, practiced: ago(1, 2, 3, 5, 6, 40) };

describe("teacherReport", () => {
  const r = teacherReport(mia, checks.filter((c) => c.kidId === "mia"), NOW);

  it("summarises reading against the named norm, with growth and history", () => {
    const reading = r.areas.find((a) => a.kind === "reading")!;
    expect(reading.latest).toMatchObject({ score: 47, accuracyPercent: 96, verdict: "On track" });
    expect(reading.benchmark.value).toBe(50);
    expect(reading.benchmark.source).toContain("Hasbrouck & Tindal (2017)");
    expect(reading.change).toBe("+11 words a minute in 3 weeks");
    expect(reading.history.map((h) => h.score)).toEqual([47, 41, 39, 36]);
  });

  it("names the math benchmark, counts recent practice only, and adds the goal", () => {
    expect(r.areas.find((a) => a.kind === "math")!.benchmark.source).toContain("Rocket Math");
    expect(r.practice.daysLast4Weeks).toBe(5);
    expect(r.goal).toContain("47 → 53 words a minute");
  });

  it("asks about math when math needs practice, and never uses diagnosis wording", () => {
    expect(r.questions.some((q) => q.includes("math facts"))).toBe(true);
    const text = reportText(r);
    expect(text).toContain("It is not a diagnosis.");
    expect(text.toLowerCase()).not.toMatch(/dyslexi|disorder|disabilit/);
  });
});
