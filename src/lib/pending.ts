"use client";

// Browser storage for things that happen before the parent has an account: the last result
// (saved to the account after sign-in) and the microphone consent.

import type { ReadingRecord } from "@/lib/reading/record";
import type { ParentSummary } from "@/lib/reading/summary";

const PENDING_KEY = "readcheck:pending:v1";
const CONSENT_KEY = "readcheck:consent:v1";

export const CONSENT_VERSION = "2026-11";

export type PendingResult = {
  childName: string;
  childId: string | null;
  record: ReadingRecord;
  summary: ParentSummary | null;
};

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage blocked: the result just won't carry over to sign-in.
  }
}

export const readPending = () => read<PendingResult>(PENDING_KEY);
export const savePending = (pending: PendingResult) => write(PENDING_KEY, pending);
export const clearPending = () => write(PENDING_KEY, null);

export const readConsent = () => read<{ version: string; at: string }>(CONSENT_KEY);
export const saveConsent = () => write(CONSENT_KEY, { version: CONSENT_VERSION, at: new Date().toISOString() });
