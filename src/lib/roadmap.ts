// The 4-week path on Home: why to come back tomorrow. It starts at the child's latest check, aims
// for a realistic gain each week, and turns every day into one small step: practise on six days,
// re-check on the seventh. Pure functions; Home draws the result.
//
// Weekly aims follow typical growth rates, not wishes: oral reading grows about 1.5 words a
// minute per week in grades 1–2 and about 1 in grades 3–4 (Fuchs et al. 1993; Deno et al. 2001,
// via Christ et al. 2010). Letter naming in kindergarten grows about 0.75 a week (DIBELS 8 goals,
// fall 25 to winter 37). Fact fluency gains are slower; 0.5 a week is our estimate.

import { checksFor } from "@/lib/checks/quick";
import type { CheckKind, CheckRecord } from "@/lib/store/checks";
import type { Grade } from "@/lib/store/family";

export const PATH_DAYS = 28;
const DAY_MS = 86_400_000;

export const UNIT: Record<CheckKind, string> = {
  reading: "words a minute",
  math: "facts a minute",
  letters: "letters a minute",
};

/** Local calendar day, "YYYY-MM-DD". Streaks and "today" follow the phone's day, not UTC. */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a: Date, b: Date) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / DAY_MS);

/** Days in a row up to today, or up to yesterday if today isn't practised yet. */
export function streakFrom(practiced: readonly string[], today: Date): number {
  const days = new Set(practiced);
  let d = days.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function weeklyGrowth(kind: CheckKind, grade: Grade): number {
  if (kind === "reading") return grade >= 3 ? 1 : 1.5;
  if (kind === "letters") return 0.75;
  return 0.5;
}

export type DayStatus = "done" | "missed" | "today" | "todayDone" | "upcoming";

export type PathDay = {
  /** 1–28; days 7, 14, 21 and 28 are check days. */
  n: number;
  date: string;
  check: boolean;
  status: DayStatus;
};

export type PathWeek = {
  week: number;
  days: PathDay[];
  /** What the check at the end of this week aims for. */
  aim: number;
  /** The best score from a check of this kind during the week, if there was one. */
  got: number | null;
};

export type Roadmap = {
  kind: CheckKind;
  unit: string;
  start: number;
  goal: number;
  /** Day of the path today is, 1–28, or 0 on the day of the starting check. */
  today: number;
  weeks: PathWeek[];
  practicedDays: number;
  /** One line: what to do now, or what's next. */
  next: string;
  /** Today's step: practise or re-check. Null once today's practice is done. */
  action: "practice" | "check" | null;
};

/**
 * The path from the latest check of the child's main kind (reading from grade 1, letters before).
 * Null with no check yet, or when the last check is over four weeks old: a new check starts a new
 * path. `checks` come newest first, as the store gives them.
 */
export function roadmapFor(kid: { name: string; grade: Grade; practiced?: readonly string[] }, checks: CheckRecord[], now: Date): Roadmap | null {
  const main = checksFor(kid.grade)[0];
  const latest = checks.find((c) => c.kind === main) ?? checks[0];
  if (!latest) return null;
  const startDate = new Date(latest.at);
  const today = daysBetween(startDate, now);
  if (today > PATH_DAYS) return null;

  const kind = latest.kind;
  const growth = weeklyGrowth(kind, kid.grade);
  const practiced = new Set(kid.practiced ?? []);
  const checkDays = new Set(checks.filter((c) => c.kind === kind).map((c) => dayKey(new Date(c.at))));
  const todayKey = dayKey(now);

  const weeks: PathWeek[] = [1, 2, 3, 4].map((week) => {
    const days: PathDay[] = [];
    for (let i = 1; i <= 7; i++) {
      const n = (week - 1) * 7 + i;
      const date = dayKey(addDays(startDate, n));
      const check = i === 7;
      // Only a real check completes check day; a game that day is still practice.
      const did = check ? checkDays.has(date) : practiced.has(date);
      const status: DayStatus = n < today ? (did ? "done" : "missed") : n === today ? (did ? "todayDone" : "today") : "upcoming";
      days.push({ n, date, check, status });
    }
    const inWeek = checks.filter((c) => {
      const d = daysBetween(startDate, new Date(c.at));
      return c.kind === kind && c.id !== latest.id && d > (week - 1) * 7 && d <= week * 7 + 3;
    });
    return { week, days, aim: Math.round(latest.score + growth * week), got: inWeek.length ? Math.max(...inWeek.map((c) => c.score)) : null };
  });

  const all = weeks.flatMap((w) => w.days);
  const todayStep = all.find((d) => d.n === today);
  const tomorrow = all.find((d) => d.n === today + 1);
  const thisWeek = weeks[Math.min(3, Math.max(0, Math.ceil(today / 7) - 1))];
  const unit = UNIT[kind];

  let next: string;
  let action: Roadmap["action"];
  if (today === 0) {
    next = `Day 1 starts tomorrow: a few minutes of practice. By the end of the week, aim for ${weeks[0].aim}.`;
    action = practiced.has(todayKey) ? null : "practice";
  } else if (todayStep?.check && todayStep.status === "today") {
    next = `Today is check day: aim for ${thisWeek.aim} ${unit}.`;
    action = "check";
  } else if (todayStep?.status === "todayDone") {
    next = tomorrow ? `Done for today! Tomorrow is day ${tomorrow.n}${tomorrow.check ? ": check day" : ""}.` : "Done for today! The 4 weeks are complete: do a check to start the next path.";
    action = null;
  } else {
    next = `Day ${today} of ${PATH_DAYS}: a few minutes of practice keeps ${kid.name} on the path to ${weeks[3].aim}.`;
    action = "practice";
  }

  return {
    kind,
    unit,
    start: latest.score,
    goal: weeks[3].aim,
    today,
    weeks,
    practicedDays: all.filter((d) => !d.check && (d.status === "done" || d.status === "todayDone")).length,
    next,
    action,
  };
}

/**
 * The path's remaining check days, for a calendar reminder at 6 pm each week. Null when none are
 * left. Today counts if its check isn't done and 6 pm hasn't passed.
 */
export function remainingCheckDays(roadmap: Roadmap, now: Date): { start: Date; count: number } | null {
  const pending = roadmap.weeks
    .map((w) => w.days[6])
    .filter((d) => d.status === "upcoming" || d.status === "today")
    .map((d) => new Date(`${d.date}T18:00:00`))
    .filter((d) => d.getTime() > now.getTime());
  return pending.length ? { start: pending[0], count: pending.length } : null;
}
