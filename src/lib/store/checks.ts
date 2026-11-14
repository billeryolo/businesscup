"use client";

// Every finished 1-minute check, kept on this phone next to the family. Progress reads this list.

import { useMemo, useSyncExternalStore } from "react";
import type { Verdict } from "@/lib/reading/assess";
import { createLocalStore } from "./local";

export type CheckKind = "reading" | "math" | "letters";

export type CheckRecord = {
  id: string;
  kidId: string;
  kind: CheckKind;
  /** ISO date and time. */
  at: string;
  /** Per minute: words read correctly, facts answered, or letters named. */
  score: number;
  /** Share answered or read correctly, 0–1. */
  accuracy: number;
  /** What the score is compared with: the grade median for reading, the practice goal otherwise. */
  target: number;
  verdict: Verdict;
};

const store = createLocalStore<CheckRecord[]>("readcheck.checks.v1", []);

export const checkActions = {
  add(record: Omit<CheckRecord, "id">): CheckRecord {
    const saved = { ...record, id: crypto.randomUUID() };
    store.write([saved, ...store.read()]);
    return saved;
  },
  /** Replaces every saved check, e.g. with the demo family's history. */
  replaceAll(records: CheckRecord[]) {
    store.write(records);
  },
  removeForKid(kidId: string) {
    store.write(store.read().filter((c) => c.kidId !== kidId));
  },
  clearAll() {
    store.write([]);
  },
};

/** A child's checks, newest first. */
export function useChecks(kidId: string | undefined) {
  const all = useSyncExternalStore(store.subscribe, store.read, () => null);
  return useMemo(() => (all ?? []).filter((c) => c.kidId === kidId), [all, kidId]);
}

const NO_CHECKS: CheckRecord[] = [];

/** Every child's checks, newest first. */
export function useAllChecks() {
  return useSyncExternalStore(store.subscribe, store.read, () => null) ?? NO_CHECKS;
}
