// Numbers derived from what's stored: stars, streak, next check, the Progress chart, and the
// child snapshot sent to the AI routes. Nothing here is stored.

import { checkForDomain, childTypeFor, normFor, UNIT } from "@/lib/checks/norms";
import { addDays, dateKey, daysBetween, startOfWeek } from "@/lib/dates";
import type { AppData, ChildSnapshot, ChildStats, Domain, Plan, ProgressSeries, Season } from "@/lib/types";

const CHECK_EVERY_DAYS = 7;
const MAX_RECENT_RESULTS = 5;
const MAX_DIARY = 10;

export function currentPlan(data: AppData, childId: string): Plan | null {
  const plans = data.plans.filter((p) => p.childId === childId);
  return plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export function childStats(data: AppData, childId: string, now: Date): ChildStats {
  const sessions = data.sessions.filter((s) => s.childId === childId);
  // Bonus stars from Buddy are logged as 0-minute sessions; they don't count as a practice day.
  const days = new Set(sessions.filter((s) => s.minutes > 0).map((s) => s.date));
  const today = dateKey(now);

  // A streak still counts until the end of today if yesterday was practised.
  let streakDays = 0;
  let day = days.has(today) ? now : addDays(now, -1);
  while (days.has(dateKey(day))) {
    streakDays++;
    day = addDays(day, -1);
  }

  const results = data.results.filter((r) => r.childId === childId);
  const lastCheckAt = results.reduce<string | null>((latest, r) => (!latest || r.takenAt > latest ? r.takenAt : latest), null);
  const due = lastCheckAt ? addDays(new Date(lastCheckAt), CHECK_EVERY_DAYS) : now;

  const weekStart = dateKey(startOfWeek(now));
  return {
    stars: sessions.reduce((sum, s) => sum + s.stars, 0),
    streakDays,
    practicedToday: days.has(today),
    lastCheckAt,
    nextCheckDue: dateKey(due < now ? now : due),
    minutesThisWeek: sessions.filter((s) => s.date >= weekStart && s.date <= today).reduce((sum, s) => sum + s.minutes, 0),
  };
}

const SEASONS: Season[] = ["fall", "winter", "spring"];

export function progressSeries(data: AppData, childId: string, domain: Domain): ProgressSeries {
  const child = data.children.find((c) => c.id === childId);
  const results = data.results
    .filter((r) => r.childId === childId && r.domain === domain)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  const kind = results.at(-1)?.kind ?? (child ? checkForDomain(domain, child.grade) : null);
  const unit = kind ? UNIT[kind] : "per minute";

  const points = results.map((r) => ({ at: r.takenAt, value: r.perMinute, resultId: r.id }));
  const norm = child && kind
    ? SEASONS.flatMap((season) => {
        const n = normFor(kind, child.grade, season);
        return n ? [{ season, value: n.onTrackMin, source: n.source }] : [];
      })
    : [];

  let projection: ProgressSeries["projection"] = null;
  let summary: string | null = null;
  if (points.length >= 2) {
    const first = new Date(points[0].at);
    const xs = points.map((p) => daysBetween(first, new Date(p.at)));
    const ys = points.map((p) => p.value);
    const slope = leastSquaresSlope(xs, ys);
    const last = points[points.length - 1];
    const lastDate = new Date(last.at);
    projection = [0, 14, 28].map((d) => ({
      at: addDays(lastDate, d).toISOString(),
      value: Math.max(0, Math.round(last.value + slope * d)),
    }));

    const delta = last.value - points[0].value;
    const days = Math.max(1, daysBetween(first, lastDate));
    const weeks = Math.round(days / 7);
    const span = weeks >= 1 ? `${weeks} week${weeks === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"}`;
    summary = `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} ${unit} in ${span}`;
  }

  return { childId, domain, unit, points, norm, projection, summary };
}

function leastSquaresSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** What the AI routes get to know about a child. No items (individual words) are sent. */
export function toChildSnapshot(data: AppData, childId: string, now: Date): ChildSnapshot & { id: string } {
  const child = data.children.find((c) => c.id === childId);
  if (!child) throw new Error(`No child ${childId}`);
  const plan = currentPlan(data, childId);
  return {
    id: child.id,
    firstName: child.firstName,
    grade: child.grade,
    type: childTypeFor(child.grade),
    stats: childStats(data, childId, now),
    recentResults: data.results
      .filter((r) => r.childId === childId)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      .slice(0, MAX_RECENT_RESULTS)
      .map((r) => {
        const rest: Partial<typeof r> = { ...r };
        delete rest.items;
        delete rest.childId;
        return rest as Omit<typeof r, "items" | "childId">;
      }),
    plan: plan ? { minutesPerDay: plan.minutesPerDay, focus: plan.focus, weeks: plan.weeks, startsOn: plan.startsOn } : null,
    diary: data.diary
      .filter((d) => d.childId === childId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_DIARY)
      .map(({ at, text, by }) => ({ at, text, by })),
  };
}
