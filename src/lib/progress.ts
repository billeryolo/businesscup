// Numbers for the Progress tab, from the checks saved on this phone (src/lib/store/checks.ts):
// the points to plot, the line to compare with, "+11 words a minute in 3 weeks", and a dashed
// "if you keep this pace" line. Pure functions; nothing here is stored.

import type { CheckKind, CheckRecord } from "@/lib/store/checks";

export const PER_MINUTE: Record<CheckKind, string> = {
  reading: "words a minute",
  math: "facts a minute",
  letters: "letters a minute",
};

export type Progress = {
  kind: CheckKind;
  unit: string;
  /** Oldest first. */
  points: { id: string; at: string; score: number; target: number; verdict: CheckRecord["verdict"] }[];
  /** The latest check's target (grade median for reading, the goal otherwise), or null with no checks. */
  target: number | null;
  /** e.g. "+11 words a minute in 3 weeks"; null with fewer than 2 checks. */
  summary: string | null;
  /** From the latest check, 2 and 4 weeks ahead at the current pace; null with fewer than 2 checks. */
  projection: { at: string; score: number }[] | null;
};

const DAY = 86_400_000;

export function progressFor(checks: CheckRecord[], kind: CheckKind): Progress {
  const points = checks
    .filter((c) => c.kind === kind)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ id, at, score, target, verdict }) => ({ id, at, score, target, verdict }));
  const unit = PER_MINUTE[kind];
  const last = points.at(-1);
  if (!last || points.length < 2) return { kind, unit, points, target: last?.target ?? null, summary: null, projection: null };

  const t0 = Date.parse(points[0].at);
  const days = points.map((p) => (Date.parse(p.at) - t0) / DAY);
  const slope = leastSquaresSlope(days, points.map((p) => p.score)); // per day
  const lastAt = Date.parse(last.at);
  const projection = [14, 28].map((d) => ({ at: new Date(lastAt + d * DAY).toISOString(), score: Math.max(0, Math.round(last.score + slope * d)) }));

  const delta = last.score - points[0].score;
  const span = Math.max(1, Math.round((lastAt - t0) / DAY));
  const weeks = Math.round(span / 7);
  const when = weeks >= 1 ? `${weeks} week${weeks === 1 ? "" : "s"}` : `${span} day${span === 1 ? "" : "s"}`;
  const summary = `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} ${unit} in ${when}`;

  return { kind, unit, points, target: last.target, summary, projection };
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
