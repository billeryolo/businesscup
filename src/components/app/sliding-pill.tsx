"use client";

// The dark pill behind the chosen option of a segmented switch. It is one element moved sideways
// by slot, so it can only slide left and right. (A shared-layout animation measures the page and
// makes the pill jump in from above or below when the page scrolls or changes height.)
// Put it first inside a `relative` container with `p-1` and equal-width options.

import { motion } from "motion/react";

export function SlidingPill({ index, count }: { index: number; count: number }) {
  if (index < 0) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-1">
      <motion.span
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        style={{ width: `${100 / count}%` }}
        className="block h-full rounded-full bg-night"
      />
    </span>
  );
}
