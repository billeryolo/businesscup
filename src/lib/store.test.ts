import { describe, expect, it } from "vitest";
import { checkForDomain, checksForGrade, mathOpsFor, normFor, placementFor, verdictFor } from "./checks/norms";
import { buildResult } from "./checks/result";
import { dateKey } from "./dates";
import { demoFamily } from "./demo";
import { createStore, STORAGE_KEY, type StorageLike } from "./store";
import type { CheckItem } from "./types";

// Saturday 14 November 2026, evening (fall).
const NOW = new Date(2026, 10, 14, 21, 0);

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const letters = (right: number, wrong: number): CheckItem[] =>
  Array.from({ length: right + wrong }, (_, i) => ({ kind: "letter", shown: "A", correct: i < right }));

describe("norms", () => {
  it("uses DIBELS 8 letter naming for kindergarten", () => {
    expect(normFor("letterNaming", "K", "winter")).toMatchObject({ source: "published", onTrackMin: 37, practiceMin: 31 });
  });

  it("marks Pre-K letters and number naming as estimates", () => {
    expect(normFor("letterNaming", "preK", "spring")).toMatchObject({ source: "estimate", onTrackMin: 16, practiceMin: 8 });
    expect(normFor("numberNaming", "K", "fall")).toMatchObject({ source: "estimate", onTrackMin: 8, practiceMin: 4 });
  });

  it("gives no verdict for the kindergarten word list in the fall", () => {
    expect(normFor("wordList", "K", "fall")).toBeNull();
    expect(verdictFor("wordList", 0, 0, null)).toBeNull();
    expect(placementFor(3, null)).toEqual({ kind: "none" });
  });

  it("averages the Rocket Math goals of the operations in the check", () => {
    expect(mathOpsFor(4, "winter")).toEqual(["+", "-", "×", "÷"]);
    expect(normFor("mathFacts", 4, "winter")).toMatchObject({ onTrackMin: 31, practiceMin: 16 });
    expect(normFor("mathFacts", 1, "fall")).toMatchObject({ onTrackMin: 12 });
  });

  it("keeps the existing reading rules: practice 10+ words under the median, teacher under the 25th", () => {
    const n = normFor("passage", 2, "fall")!; // p25 = 36, p50 = 50
    expect(n).toMatchObject({ onTrackMin: 41, practiceMin: 36 });
    expect(verdictFor("passage", 45, 0.98, n)).toBe("onTrack");
    expect(verdictFor("passage", 45, 0.93, n)).toBe("practice");
    expect(verdictFor("passage", 38, 0.98, n)).toBe("practice");
    expect(verdictFor("passage", 30, 0.98, n)).toBe("talkToTeacher");
    expect(placementFor(45, n)).toEqual({ kind: "percentile", band: "25to50" });
  });

  it("never sends grade 1 in the fall to the teacher on speed alone", () => {
    const n = normFor("passage", 1, "fall")!;
    expect(n.season).toBe("winter");
    expect(verdictFor("passage", 2, 1, n)).toBe("practice");
  });

  it("offers the checks from the agreed lineup", () => {
    expect(checksForGrade("preK")).toEqual(["letterNaming", "numberNaming"]);
    expect(checksForGrade("K")).toContain("wordList");
    expect(checkForDomain("reading", "K")).toBe("wordList");
    expect(checkForDomain("math", "preK")).toBeNull();
  });
});

describe("buildResult", () => {
  it("scores items into a result with a verdict and band", () => {
    const r = buildResult({ childId: "c", grade: "K", kind: "letterNaming", mode: "manual", takenAt: NOW, seconds: 60, items: letters(20, 5) });
    expect(r).toMatchObject({ domain: "letters", season: "fall", attempted: 25, correct: 20, errors: 5, perMinute: 20, verdict: "practice" });
    expect(r.placement).toEqual({ kind: "band", band: "yellow" });
  });

  it("scales a check that ended early to a per-minute score", () => {
    const r = buildResult({ childId: "c", grade: "K", kind: "letterNaming", mode: "manual", takenAt: NOW, seconds: 30, items: letters(15, 0) });
    expect(r.perMinute).toBe(30);
  });
});

describe("store", () => {
  it("adds children up to three and keeps them in localStorage", () => {
    const storage = memoryStorage();
    const store = createStore({ storage, now: () => NOW });
    const a = store.addChild({ firstName: " Ava ", grade: 1, avatar: "owl" });
    store.addChild({ firstName: "Ben", grade: "K", avatar: "cat" });
    store.addChild({ firstName: "Cy", grade: "preK", avatar: "dog" });
    expect(a.firstName).toBe("Ava");
    expect(() => store.addChild({ firstName: "Dee", grade: 2, avatar: "fox" })).toThrow();
    expect(createStore({ storage }).get().children.map((c) => c.firstName)).toEqual(["Ava", "Ben", "Cy"]);
  });

  it("replaces the data object on every change and notifies subscribers", () => {
    const store = createStore({ now: () => NOW });
    const before = store.get();
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.updateSettings({ sounds: false });
    off();
    store.updateSettings({ sounds: true });
    expect(store.get()).not.toBe(before);
    expect(calls).toBe(1);
  });

  it("deletes a child's results, plans, sessions and diary with the child", () => {
    const store = createStore({ now: () => NOW });
    const c = store.addChild({ firstName: "Ava", grade: "K", avatar: "owl" });
    const r = buildResult({ childId: c.id, grade: "K", kind: "letterNaming", mode: "manual", takenAt: NOW, seconds: 60, items: letters(30, 2) });
    store.saveResult(r);
    store.startPlan(r.id);
    store.logSession({ childId: c.id, date: dateKey(NOW), minutes: 10, source: "app", activities: [], stars: 3 });
    store.addDiary({ childId: c.id, text: "b and d", by: "parent" });
    store.deleteChild(c.id);
    const d = store.get();
    expect([d.children, d.results, d.plans, d.sessions, d.diary].every((xs) => xs.length === 0)).toBe(true);
  });

  it("applies a plan change and undoes it", () => {
    const store = createStore({ now: () => NOW });
    const c = store.addChild({ firstName: "Ava", grade: 2, avatar: "owl" });
    const r = buildResult({ childId: c.id, grade: 2, kind: "mathFacts", mode: "manual", takenAt: NOW, seconds: 60, items: [] });
    store.saveResult(r);
    store.startPlan(r.id);
    const { undo } = store.applyPlanChange(c.id, { kind: "setMinutes", weekday: 5, weekend: 10 });
    expect(store.currentPlan(c.id)?.minutesPerDay).toEqual({ weekday: 5, weekend: 10 });
    expect(store.get().children[0].minutesPerDay).toEqual({ weekday: 5, weekend: 10 });
    undo();
    expect(store.currentPlan(c.id)?.minutesPerDay).toEqual({ weekday: 10, weekend: 10 });
    expect(store.get().children[0].minutesPerDay).toEqual({ weekday: 10, weekend: 10 });
  });

  it("survives corrupt storage and clears everything on delete all", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    const store = createStore({ storage, now: () => NOW });
    expect(store.get().children).toEqual([]);
    store.loadDemoFamily();
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
    store.deleteAllData();
    expect(store.get()).toMatchObject({ demo: false, onboardedAt: null, children: [] });
  });
});

describe("demo family", () => {
  const data = demoFamily(NOW, "device");
  const store = createStore({ now: () => NOW });
  store.loadDemoFamily();

  it("has Mia (grade 2) and Leo (Pre-K) with consistent references", () => {
    expect(data.children.map((c) => `${c.firstName} ${c.grade}`)).toEqual(["Mia 2", "Leo preK"]);
    const ids = new Set(data.children.map((c) => c.id));
    for (const x of [...data.results, ...data.plans, ...data.sessions, ...data.diary]) expect(ids.has(x.childId)).toBe(true);
  });

  it("shows Mia growing to on track, with a 4-day streak", () => {
    const mia = store.get().children[0];
    const p = store.progress(mia.id, "reading");
    expect(p.points.map((x) => x.value)).toEqual([36, 39, 41, 47]);
    expect(p.summary).toBe("+11 words per minute in 3 weeks");
    expect(p.projection).toHaveLength(3);
    expect(store.get().results.find((r) => r.id === "demo-mia-r4")?.verdict).toBe("onTrack");
    const s = store.stats(mia.id);
    expect(s).toMatchObject({ streakDays: 4, practicedToday: true });
    expect(s.stars).toBeGreaterThan(50);
  });

  it("gives each child a plan", () => {
    for (const c of store.get().children) expect(store.currentPlan(c.id)?.weeks).toHaveLength(4);
  });
});
