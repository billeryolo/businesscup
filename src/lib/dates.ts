// Local calendar dates ("YYYY-MM-DD"). Streaks and "today" follow the phone's own day, not UTC.

import type { IsoDate } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

export function dateKey(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: IsoDate): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Monday of the week containing d, at local midnight. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86_400_000);
}
