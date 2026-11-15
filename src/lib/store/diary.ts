"use client";

// Notes the parent told the assistant ("mixing up b and d", "we read together for 20 minutes"),
// kept on this phone next to the family. Progress shows them under the chart.

import { useMemo, useSyncExternalStore } from "react";
import { createLocalStore } from "./local";

export type DiaryEntry = { id: string; kidId: string; at: string; text: string; minutes?: number };

const store = createLocalStore<DiaryEntry[]>("readcheck.diary.v1", []);
const NONE: DiaryEntry[] = [];

export const diaryActions = {
  add(entry: Omit<DiaryEntry, "id" | "at">): DiaryEntry {
    const saved = { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() };
    store.write([saved, ...store.read()].slice(0, 200));
    return saved;
  },
  remove(id: string) {
    store.write(store.read().filter((e) => e.id !== id));
  },
  clearAll() {
    store.write([]);
  },
};

/** A child's notes, newest first. */
export function useDiary(kidId: string | undefined): DiaryEntry[] {
  const all = useSyncExternalStore(store.subscribe, store.read, () => null);
  return useMemo(() => (kidId ? (all ?? NONE).filter((e) => e.kidId === kidId) : NONE), [all, kidId]);
}
