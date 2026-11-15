"use client";

// ReadBuddy Plus: what's free, what's paid, and the price. During the beta nothing is charged:
// "Start 7 days free" records the interest (POST /api/interest) and remembers it on this phone.

import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/store/local";

export type PlusPlan = "yearly" | "monthly";

export const PRICES: Record<PlusPlan, { price: string; per: string; note: string }> = {
  yearly: { price: "$99", per: "a year", note: "$8.25 a month · save 45%" },
  monthly: { price: "$14.99", per: "a month", note: "Cancel any time" },
};

export const FREE = ["The 1-minute reading, letters and math check", "The result in plain words, against national norms"];

export const PLUS = [
  "The 4-week path: a goal, a short practice every day, a check every week",
  "All games, ReadBuddy's voice and stories about what your child loves",
  "Progress over time against the grade's benchmark",
  "The one-page report for the teacher",
  "The assistant, answering from your child's real numbers",
  "Up to 3 children",
];

export type TrialRequest = { plan: PlusPlan; at: string } | null;

const store = createLocalStore<TrialRequest>("readcheck.plus.v1", null);

export const plusActions = {
  /** Forget the trial on this phone: a fresh demo family or "Erase everything" shows the offer again. */
  reset() {
    store.write(null);
  },
  async startTrial(plan: PlusPlan, context: { grade: number | null; verdict: "onTrack" | "practice" | "talkToTeacher" | null }) {
    store.write({ plan, at: new Date().toISOString() });
    // Best effort: the interest count shouldn't block the parent.
    await fetch("/api/interest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, grade: context.grade, verdict: context.verdict }),
    }).catch(() => {});
  },
};

/** undefined while loading, null when no trial was started on this phone. */
export function useTrial(): TrialRequest | undefined {
  return useSyncExternalStore(store.subscribe, store.read, () => undefined);
}
