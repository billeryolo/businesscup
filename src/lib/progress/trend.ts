// What the Progress screen draws: one kind of check over time, placed against its goal.

import type { CheckKind, CheckRecord } from "@/lib/store/checks";

export const SHOWN = 8;

export type Trend = {
  /** Oldest first, at most the last eight. */
  points: CheckRecord[];
  latest: CheckRecord;
  /** Latest score minus the first one shown; 0 with a single check. */
  change: number;
  best: number;
  target: number;
};

/** `checks` come newest first, as the store gives them. */
export function trendFor(checks: CheckRecord[], kind: CheckKind): Trend | null {
  const points = checks.filter((c) => c.kind === kind).slice(0, SHOWN).reverse();
  if (!points.length) return null;
  const latest = points[points.length - 1];
  return { points, latest, change: latest.score - points[0].score, best: Math.max(...points.map((p) => p.score)), target: latest.target };
}

export type Box = { width: number; height: number; left: number; right: number; top: number; bottom: number };

/** Where each score sits in the drawing, with room above the highest of score and goal. */
export function place(scores: number[], target: number, box: Box) {
  const max = Math.max(target, ...scores, 1) * 1.15;
  // The scale starts at half the lowest value, not zero, so a few points of growth are visible.
  const min = Math.min(target, ...scores) * 0.5;
  const innerW = box.width - box.left - box.right;
  const innerH = box.height - box.top - box.bottom;
  const y = (value: number) => box.top + innerH * (1 - (value - min) / (max - min));
  const x = (i: number) => (scores.length === 1 ? box.left + innerW / 2 : box.left + (innerW * i) / (scores.length - 1));
  return { dots: scores.map((s, i) => ({ x: x(i), y: y(s) })), goalY: y(target), floor: box.height - box.bottom };
}

/** A soft curve through the dots: each segment bends at the halfway point, so it never overshoots. */
export function curve(dots: { x: number; y: number }[]): string {
  if (!dots.length) return "";
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(dots[0].x)} ${r(dots[0].y)}`;
  for (let i = 1; i < dots.length; i++) {
    const mid = (dots[i - 1].x + dots[i].x) / 2;
    d += ` C${r(mid)} ${r(dots[i - 1].y)} ${r(mid)} ${r(dots[i].y)} ${r(dots[i].x)} ${r(dots[i].y)}`;
  }
  return d;
}

export function changeText(trend: Trend): string {
  if (trend.points.length < 2) return "First check. Do one a week to see the line grow.";
  const n = trend.points.length;
  if (trend.change > 0) return `Up ${trend.change} over ${n} checks`;
  if (trend.change < 0) return `Down ${-trend.change} over ${n} checks`;
  return `Steady over ${n} checks`;
}
