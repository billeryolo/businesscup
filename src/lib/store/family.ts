"use client";

// The family lives on this phone only: no account, no sign-in. Everything is one JSON value in
// localStorage, read through useSyncExternalStore so every screen updates together.

import { useSyncExternalStore } from "react";
import { createLocalStore } from "./local";

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
  streakDays: number;
};

export type Family = {
  kids: Kid[];
  activeId: string | null;
  /** True once the parent has finished (or skipped through) onboarding. */
  onboarded: boolean;
};

export const MAX_KIDS = 3;
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
    write({ ...family, kids: family.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
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
    write(demoFamily);
  },
  clearAll() {
    write(EMPTY);
  },
};

/**
 * `ready` is false on the server and during hydration, so screens can show a calm placeholder
 * instead of flashing the empty state.
 */
export function useFamily() {
  const family = useSyncExternalStore(store.subscribe, store.read, () => null);
  const kids = family?.kids ?? [];
  const active = kids.find((k) => k.id === family?.activeId) ?? kids[0] ?? null;
  return { ready: family !== null, onboarded: family?.onboarded ?? false, kids, active };
}
