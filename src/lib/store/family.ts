"use client";

// The family lives on this phone only: no account, no sign-in. Everything is one JSON value in
// localStorage, read through useSyncExternalStore so every screen updates together.

import { useSyncExternalStore } from "react";
import { checkActions } from "./checks";
import { demoChecks } from "./demo-checks";
import { createLocalStore } from "./local";
import { dayKey, streakFrom } from "@/lib/roadmap";
import { plusActions } from "@/lib/plus";
import { diaryActions } from "./diary";

export type AnimalId = "lion" | "koala" | "monkey" | "bear" | "bunny" | "fox";
export const ANIMALS: AnimalId[] = ["lion", "koala", "monkey", "bear", "bunny", "fox"];

/** -1 is Pre-K, 0 is Kindergarten, 1–4 are school grades. */
export type Grade = -1 | 0 | 1 | 2 | 3 | 4;
export type Archetype = "explorer" | "builder" | "reader";

export type Kid = {
  id: string;
  name: string;
  grade: Grade;
  avatar: AnimalId;
  stars: number;
  /** Days in a row; worked out from `practiced` when there is one (see useFamily). */
  streakDays: number;
  /** Days with any practice, "YYYY-MM-DD" on this phone's calendar. Drives the streak and the path. */
  practiced?: string[];
  /** Daily practice minutes chosen by the parent (via the assistant); the grade default otherwise. */
  minutes?: number;
};

export type Family = {
  kids: Kid[];
  activeId: string | null;
  /** True once the parent has finished (or skipped through) onboarding. */
  onboarded: boolean;
};

import { MAX_KIDS } from "./limits";

export { MAX_KIDS };
const KEY = "readcheck.family.v1";
const EMPTY: Family = { kids: [], activeId: null, onboarded: false };

export const demoFamily: Family = {
  kids: [
    { id: "demo-mia", name: "Mia", grade: 2, avatar: "lion", stars: 46, streakDays: 4 },
    { id: "demo-leo", name: "Leo", grade: -1, avatar: "koala", stars: 12, streakDays: 2 },
  ],
  activeId: "demo-mia",
  onboarded: true,
};

export const gradeLabel = (grade: Grade) => (grade === -1 ? "Pre-K" : grade === 0 ? "Kindergarten" : `Grade ${grade}`);
export const archetypeFor = (grade: Grade): Archetype => (grade === -1 ? "explorer" : grade <= 1 ? "builder" : "reader");
export const minutesFor = (grade: Grade) => (grade === -1 ? 5 : grade <= 1 ? 10 : 15);
/** The child's daily minutes: the parent's choice, or the grade default. */
export const kidMinutes = (kid: Pick<Kid, "grade" | "minutes">) => kid.minutes ?? minutesFor(kid.grade);

const store = createLocalStore<Family>(KEY, EMPTY, (parsed) => ({ ...EMPTY, ...(parsed as Family) }));
const { read, write } = store;

// --- actions -------------------------------------------------------------------------------

export const familyActions = {
  addKid(input: Pick<Kid, "name" | "grade" | "avatar">): Kid | null {
    const family = read();
    if (family.kids.length >= MAX_KIDS) return null;
    const kid: Kid = { id: crypto.randomUUID(), stars: 0, streakDays: 0, ...input, name: input.name.trim() };
    write({ ...family, kids: [...family.kids, kid], activeId: kid.id, onboarded: true });
    return kid;
  },
  updateKid(id: string, patch: Partial<Omit<Kid, "id">>) {
    const family = read();
    write({
      ...family,
      kids: family.kids.map((k) => {
        if (k.id !== id) return k;
        const next = { ...k, ...patch };
        // Earning stars in a game counts as practice today: it moves the streak and the path.
        if (patch.stars !== undefined && patch.stars > k.stars) next.practiced = markToday(k.practiced);
        return next;
      }),
    });
  },
  /** Practice logged by the parent (e.g. "we read together for 20 minutes"): counts for today. */
  markPracticed(id: string) {
    const family = read();
    write({ ...family, kids: family.kids.map((k) => (k.id === id ? { ...k, practiced: markToday(k.practiced) } : k)) });
  },
  removeKid(id: string) {
    const family = read();
    const kids = family.kids.filter((k) => k.id !== id);
    write({ ...family, kids, activeId: family.activeId === id ? (kids[0]?.id ?? null) : family.activeId });
  },
  setActive(id: string) {
    write({ ...read(), activeId: id });
  },
  loadDemoFamily() {
    const now = new Date();
    // Mia practised the last four days and the first two days of her path; Leo the last two.
    const ago = (...days: number[]) => days.map((d) => dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d)));
    const practiced: Record<string, string[]> = { "demo-mia": ago(1, 2, 3, 5, 6), "demo-leo": ago(1, 2) };
    write({ ...demoFamily, kids: demoFamily.kids.map((k) => ({ ...k, practiced: practiced[k.id] })) });
    // A few weeks of past checks, so Home and Progress show growth straight away.
    checkActions.replaceAll(demoChecks(new Date(), { mia: "demo-mia", leo: "demo-leo" }));
    plusActions.reset();
    diaryActions.clearAll();
    diaryActions.add({ kidId: "demo-mia", text: "Read a library book together for 20 minutes.", minutes: 20 });
    diaryActions.add({ kidId: "demo-mia", text: "Mixing up b and d in her homework." });
  },
  clearAll() {
    write(EMPTY);
    plusActions.reset();
    diaryActions.clearAll();
  },
};

/**
 * `ready` is false on the server and during hydration, so screens can show a calm placeholder
 * instead of flashing the empty state.
 */
function markToday(practiced: string[] = []): string[] {
  const today = dayKey(new Date());
  return practiced.includes(today) ? practiced : [...practiced.slice(-59), today];
}

/** The streak as of today: it drops to 0 after a missed day, not only when a game is played. */
const withLiveStreak = (k: Kid): Kid => (k.practiced ? { ...k, streakDays: streakFrom(k.practiced, new Date()) } : k);

export function useFamily() {
  const family = useSyncExternalStore(store.subscribe, store.read, () => null);
  const kids = (family?.kids ?? []).map(withLiveStreak);
  const active = kids.find((k) => k.id === family?.activeId) ?? kids[0] ?? null;
  return { ready: family !== null, onboarded: family?.onboarded ?? false, kids, active };
}
