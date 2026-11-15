import { describe, expect, it } from "vitest";
import { demoChecks } from "./store/demo-checks";
import { dayKey, remainingCheckDays, roadmapFor, streakFrom } from "./roadmap";
import type { CheckRecord } from "./store/checks";

// Saturday 14 November 2026, evening.
const NOW = new Date(2026, 10, 14, 20, 0);
const ago = (...days: number[]) => days.map((d) => dayKey(new Date(2026, 10, 14 - d)));

describe("streakFrom", () => {
  it("counts back from today, or from yesterday when today isn't done yet", () => {
    expect(streakFrom(ago(0, 1, 2), NOW)).toBe(3);
    expect(streakFrom(ago(1, 2, 3), NOW)).toBe(3);
    expect(streakFrom(ago(2, 3), NOW)).toBe(0);
    expect(streakFrom([], NOW)).toBe(0);
  });
});

describe("roadmapFor", () => {
  const checks = demoChecks(NOW, { mia: "mia", leo: "leo" });
  const miaChecks = checks.filter((c) => c.kidId === "mia");
  const mia = { name: "Mia", grade: 2 as const, practiced: ago(1, 2, 3, 5, 6) };

  it("starts at Mia's last reading check and aims for typical growth each week", () => {
    const r = roadmapFor(mia, miaChecks, NOW)!;
    expect(r.kind).toBe("reading");
    expect(r.start).toBe(47);
    expect(r.weeks.map((w) => w.aim)).toEqual([49, 50, 52, 53]); // +1.5 a week, grade 2
    expect(r.goal).toBe(53);
  });

  it("makes today, a week after the check, check day", () => {
    const r = roadmapFor(mia, miaChecks, NOW)!;
    expect(r.today).toBe(7);
    expect(r.action).toBe("check");
    expect(r.next).toBe("Today is check day: aim for 49 words a minute.");
    expect(r.weeks[0].days.map((d) => d.status)).toEqual(["done", "done", "missed", "done", "done", "done", "today"]);
    expect(r.practicedDays).toBe(5);
  });

  it("keeps check day open when only a game was played", () => {
    const r = roadmapFor({ ...mia, practiced: ago(0, 1, 2, 3, 5, 6) }, miaChecks, NOW)!;
    expect(r.action).toBe("check");
    expect(r.weeks[0].days[6].status).toBe("today");
  });

  it("starts a new path from a new check", () => {
    const newCheck: CheckRecord = { ...miaChecks.find((c) => c.kind === "reading")!, id: "new", at: NOW.toISOString(), score: 50 };
    const r = roadmapFor(mia, [newCheck, ...miaChecks], NOW)!;
    // A new check starts a new path from today.
    expect(r.today).toBe(0);
    expect(r.start).toBe(50);
  });

  it("asks for practice on a normal day and says done once practised", () => {
    const leo = { name: "Leo", grade: -1 as const, practiced: ago(1, 2) };
    const leoChecks = checks.filter((c) => c.kidId === "leo");
    const r = roadmapFor(leo, leoChecks, NOW)!;
    expect(r.kind).toBe("letters");
    expect(r.today).toBe(8);
    expect(r.action).toBe("practice");
    const done = roadmapFor({ ...leo, practiced: ago(0, 1, 2) }, leoChecks, NOW)!;
    expect(done.action).toBeNull();
    expect(done.next).toBe("Done for today! Tomorrow is day 9.");
  });

  it("has no path without a check, or after four weeks", () => {
    expect(roadmapFor(mia, [], NOW)).toBeNull();
    const old = miaChecks.map((c) => ({ ...c, at: new Date(2026, 9, 1).toISOString() }));
    expect(roadmapFor(mia, old, NOW)).toBeNull();
  });

  it("lists the check days still ahead for the calendar, skipping today once 6 pm has passed", () => {
    const r = roadmapFor(mia, miaChecks, NOW)!; // 8 pm on check day 7
    const left = remainingCheckDays(r, NOW)!;
    expect(left.count).toBe(3);
    expect([left.start.getDate(), left.start.getHours()]).toEqual([21, 18]);
    const morning = new Date(2026, 10, 14, 9, 0);
    expect(remainingCheckDays(roadmapFor(mia, miaChecks, morning)!, morning)!.count).toBe(4);
  });

  it("counts a check in one week only", () => {
    const day8 = { ...miaChecks.find((c) => c.kind === "reading")!, id: "d8", at: new Date(2026, 10, 15, 18).toISOString(), score: 49 };
    const r = roadmapFor(mia, [day8, ...miaChecks], new Date(2026, 10, 16, 9))!;
    expect(r.weeks.map((w) => w.got)).toEqual([null, null, null, null]); // a new check starts a new path
    const old = miaChecks.find((c) => c.kind === "reading")!;
    const nine = { ...old, id: "d9", at: new Date(2026, 10, 7 + 9, 18).toISOString(), score: 50 };
    const path = roadmapFor(mia, [nine, old], new Date(2026, 10, 17, 9))!;
    expect(path.start).toBe(50);
  });

  it("falls back to a recent check of another kind when the main one is old", () => {
    const oldReading = { ...miaChecks.find((c) => c.kind === "reading")!, at: new Date(2026, 8, 1).toISOString() };
    const math = miaChecks.find((c) => c.kind === "math")!;
    const r = roadmapFor(mia, [oldReading, math], NOW)!;
    expect(r.kind).toBe("math");
  });
});
