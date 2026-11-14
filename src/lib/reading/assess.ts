import { align, type Alignment, type SpokenWord } from "./align";
import { type Grade, type NormLookup, type PercentileBand, needsFluencyBuilding, normsFor, percentileBand, seasonFor } from "./norms";
import { findPatterns, type Pattern } from "./patterns";
import { applyParentMarks, type ReadingScore, scoreReading } from "./score";
import type { PassageWord } from "./text";

export type Verdict = "onTrack" | "practice" | "talkToTeacher";

export type Assessment = {
  grade: Grade;
  norms: NormLookup;
  score: ReadingScore;
  band: PercentileBand;
  /** WCPM minus the 50th percentile for the grade and season (negative = below). */
  gapToMedian: number;
  needsFluencyBuilding: boolean;
  verdict: Verdict;
  patterns: Pattern[];
  alignment: Alignment;
};

export type AssessInput = {
  passage: PassageWord[];
  spoken: SpokenWord[];
  seconds: number;
  grade: Grade;
  date: Date;
  /** Word indices the parent tapped to flip right/wrong. */
  parentMarks?: ReadonlySet<number>;
};

/**
 * Product rules on top of the norms: "talk to the teacher" below the 25th percentile or under 90%
 * accuracy; "practice" when 10+ words below the median (the norms authors' threshold) or under
 * 95% accuracy. Grade 1 in the fall has no norm yet, so speed alone never triggers the strongest
 * verdict there.
 */
export function assess({ passage, spoken, seconds, grade, date, parentMarks }: AssessInput): Assessment {
  const raw = align(passage, spoken);
  const words = parentMarks?.size ? applyParentMarks(raw.words, raw.lastAttempted, parentMarks) : raw.words;
  return assessAligned({ passage, alignment: { ...raw, words }, seconds, grade, date });
}

/**
 * The same rules for a reading that is already aligned word by word, e.g. by the speech service
 * (src/lib/speech/merge.ts).
 */
export function assessAligned({ passage, alignment, seconds, grade, date }: { passage: PassageWord[]; alignment: Alignment; seconds: number; grade: Grade; date: Date }): Assessment {
  const { words, lastAttempted } = alignment;
  const raw = { lastAttempted };
  const score = scoreReading(words, raw.lastAttempted, seconds);
  const norms = normsFor(grade, seasonFor(date));
  const fluency = needsFluencyBuilding(score.wcpm, norms.values);

  let verdict: Verdict = "onTrack";
  if (fluency || score.accuracy < 0.95) verdict = "practice";
  const slowForConcern = !norms.usedLaterSeason && score.wcpm < norms.values[25];
  if (slowForConcern || score.accuracy < 0.9) verdict = "talkToTeacher";

  return {
    grade,
    norms,
    score,
    band: percentileBand(score.wcpm, norms.values),
    gapToMedian: score.wcpm - norms.values[50],
    needsFluencyBuilding: fluency,
    verdict,
    patterns: findPatterns({ passage, words, lastAttempted: raw.lastAttempted, accuracy: score.accuracy, needsFluencyBuilding: fluency }),
    alignment,
  };
}
