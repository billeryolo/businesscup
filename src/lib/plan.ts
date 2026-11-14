// The 4-week plan made from a check, and the changes the assistant can propose to it.

import { addDays, dateKey } from "@/lib/dates";
import { UNIT } from "@/lib/checks/norms";
import { newId } from "@/lib/ids";
import { PATTERN_COPY } from "@/lib/reading/patterns";
import type { Activity, ActivityId, CheckResult, Child, Domain, Focus, GradeLevel, Plan, PlanChange, PlanWeek } from "@/lib/types";

export const ACTIVITIES: Activity[] = [
  { id: "hearLetter", domain: "letters", title: "Hear a letter", minutes: 3, grades: ["preK", "K", 1] },
  { id: "bigWord", domain: "reading", title: "Big word", minutes: 5, grades: ["K", 1, 2, 3, 4] },
  // For Pre-K and K the screen shows numbers to name instead of sums.
  { id: "speedMath", domain: "math", title: "Speed math", minutes: 3, grades: ["preK", "K", 1, 2, 3, 4] },
  { id: "story", domain: "reading", title: "Story about…", minutes: 5, grades: [1, 2, 3, 4] },
];

export function activitiesFor(grade: GradeLevel): Activity[] {
  return ACTIVITIES.filter((a) => a.grades.includes(grade));
}

const DOMAIN_SKILL: Record<Domain, { label: string; activity: ActivityId }> = {
  letters: { label: "Letter names", activity: "hearLetter" },
  reading: { label: "Reading speed", activity: "bigWord" },
  numbers: { label: "Naming numbers", activity: "speedMath" },
  math: { label: "Math facts", activity: "speedMath" },
};

export function focusTitle(focus: Focus): string {
  return focus.kind === "pattern" ? PATTERN_COPY[focus.pattern].title : focus.label;
}

function focusActivity(focus: Focus): ActivityId {
  return focus.kind === "pattern" ? "bigWord" : focus.activity;
}

const sameFocus = (a: Focus, b: Focus) => JSON.stringify(a) === JSON.stringify(b);

/** Expected growth over 4 weeks, used only to set the week-4 goal. */
function fourWeekTarget(result: CheckResult): number {
  const perWeek = result.domain === "reading" ? 2 : 1;
  return result.perMinute + perWeek * 4;
}

function weekActivities(grade: GradeLevel, focus: Focus[], domain: Domain): ActivityId[] {
  const available = activitiesFor(grade).map((a) => a.id);
  const ordered = [
    ...focus.map(focusActivity),
    ...activitiesFor(grade).filter((a) => a.domain === domain).map((a) => a.id),
    ...available,
  ];
  return [...new Set(ordered)].filter((id) => available.includes(id)).slice(0, 3);
}

export function makePlan(child: Child, result: CheckResult, today: Date, id = newId()): Plan {
  const focus: Focus[] = result.patterns.length
    ? result.patterns.slice(0, 2).map((pattern) => ({ kind: "pattern", pattern }))
    : [{ kind: "skill", ...DOMAIN_SKILL[result.domain] }];
  const activities = weekActivities(child.grade, focus, result.domain);
  const minutes = child.minutesPerDay.weekday;
  const goals = [
    `Get going: ${minutes} minutes on 5 days this week`,
    `Work on: ${focus.map(focusTitle).join(" and ")}`,
    "Keep the streak: a little practice every day",
    `Weekly check: aim for ${fourWeekTarget(result)} ${UNIT[result.kind]}`,
  ];
  const weeks: PlanWeek[] = goals.map((goal, i) => ({ week: i + 1, goal, activities }));
  return {
    id,
    childId: child.id,
    fromResultId: result.id,
    startsOn: dateKey(today),
    minutesPerDay: { ...child.minutesPerDay },
    focus,
    weeks,
    updatedAt: today.toISOString(),
  };
}

export function applyChange(plan: Plan, change: PlanChange, now: Date): Plan {
  const updatedAt = now.toISOString();
  switch (change.kind) {
    case "setMinutes":
      return { ...plan, minutesPerDay: { weekday: change.weekday, weekend: change.weekend }, updatedAt };
    case "addFocus": {
      if (plan.focus.some((f) => sameFocus(f, change.focus))) return plan;
      const activity = focusActivity(change.focus);
      const weeks = plan.weeks.map((w) => (w.activities.includes(activity) ? w : { ...w, activities: [activity, ...w.activities].slice(0, 3) }));
      return { ...plan, focus: [...plan.focus, change.focus], weeks, updatedAt };
    }
    case "removeFocus":
      return { ...plan, focus: plan.focus.filter((f) => !sameFocus(f, change.focus)), updatedAt };
  }
}

/** The plan's practice length for a given day (weekends can differ). */
export function minutesFor(plan: Plan, day: Date): number {
  const weekend = day.getDay() === 0 || day.getDay() === 6;
  return weekend ? plan.minutesPerDay.weekend : plan.minutesPerDay.weekday;
}

/** Which plan week a day falls in, 1–4, or null outside the plan. */
export function planWeek(plan: Plan, day: Date): number | null {
  const start = new Date(`${plan.startsOn}T00:00:00`);
  for (let w = 0; w < 4; w++) {
    if (day >= addDays(start, w * 7) && day < addDays(start, (w + 1) * 7)) return w + 1;
  }
  return null;
}
