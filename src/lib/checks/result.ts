// Turns the items of a finished check into a CheckResult: the big number, the verdict and where
// the child sits on the bar. The screens call this when the minute is over (or after review).

import { newId } from "@/lib/ids";
import type { CheckItem, CheckKind, CheckMode, CheckResult, GradeLevel, PatternId } from "@/lib/types";
import { CHECK_DOMAIN } from "@/lib/types";
import { isItemCorrect, normFor, placementFor, seasonFor, verdictFor } from "./norms";

export type BuildResultInput = {
  id?: string;
  childId: string;
  grade: GradeLevel;
  kind: CheckKind;
  mode: CheckMode;
  takenAt: Date;
  /** Seconds of the check the score is based on (at most 60). */
  seconds: number;
  /** Everything attempted, in order. For reading: passage words up to the last one attempted. */
  items: CheckItem[];
  textId?: string;
  patterns?: PatternId[];
};

export function buildResult(input: BuildResultInput): CheckResult {
  const { items, kind, grade } = input;
  const seconds = Math.max(0, Math.min(60, input.seconds));
  const attempted = items.length;
  const correct = items.filter(isItemCorrect).length;
  const perMinute = seconds > 0 ? Math.round((correct * 60) / seconds) : 0;
  const accuracy = attempted ? correct / attempted : 0;
  const season = seasonFor(input.takenAt);
  const norm = normFor(kind, grade, season);

  return {
    id: input.id ?? newId(),
    childId: input.childId,
    kind,
    domain: CHECK_DOMAIN[kind],
    grade,
    season,
    mode: input.mode,
    takenAt: input.takenAt.toISOString(),
    textId: input.textId,
    seconds: Math.round(seconds * 10) / 10,
    attempted,
    correct,
    errors: attempted - correct,
    perMinute,
    accuracy: Math.round(accuracy * 1000) / 1000,
    verdict: verdictFor(kind, perMinute, accuracy, norm),
    norm,
    placement: placementFor(perMinute, norm),
    patterns: input.patterns ?? [],
    items,
    text: null,
  };
}
