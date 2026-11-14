// "Kids in the same grade" numbers for every check. Sources and reasoning: docs/BENCHMARKS.md.
// Each NormUsed says whether it is published or our estimate, so the screens and the assistant
// can say so.

import { type Grade, normsFor as orfNormsFor } from "@/lib/reading/norms";
import type { CheckItem, CheckKind, ChildType, Domain, GradeLevel, MathOp, NormUsed, Placement, Season, Verdict } from "@/lib/types";

export { seasonFor } from "@/lib/reading/norms";

export function childTypeFor(grade: GradeLevel): ChildType {
  if (grade === "preK") return "explorer";
  if (grade === "K" || grade === 1) return "builder";
  return "reader";
}

export function gradeLabel(grade: GradeLevel): string {
  if (grade === "preK") return "Pre-K";
  if (grade === "K") return "Kindergarten";
  return `Grade ${grade}`;
}

/** The checks a grade can take, best fit first (the one pre-selected on the choose screen). */
export function checksForGrade(grade: GradeLevel): CheckKind[] {
  switch (grade) {
    case "preK":
      return ["letterNaming", "numberNaming"];
    case "K":
      return ["letterNaming", "wordList", "numberNaming"];
    case 1:
      return ["passage", "mathFacts", "letterNaming"];
    default:
      return ["passage", "mathFacts"];
  }
}

/** The check a domain's Progress chart and norm line are based on for this grade. */
export function checkForDomain(domain: Domain, grade: GradeLevel): CheckKind | null {
  const available = checksForGrade(grade);
  const kind: CheckKind = domain === "reading" ? (grade === "K" ? "wordList" : "passage")
    : domain === "letters" ? "letterNaming"
    : domain === "numbers" ? "numberNaming"
    : "mathFacts";
  return available.includes(kind) ? kind : null;
}

export function domainsForGrade(grade: GradeLevel): Domain[] {
  const all: Domain[] = ["letters", "reading", "numbers", "math"];
  return all.filter((d) => checkForDomain(d, grade) !== null);
}

export const UNIT: Record<CheckKind, string> = {
  passage: "words per minute",
  wordList: "words per minute",
  letterNaming: "letters per minute",
  numberNaming: "numbers per minute",
  mathFacts: "sums per minute",
};

// ---------------------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------------------

type Goal = { onTrack: number; practice: number };
type BySeason = Record<Season, Goal | null>;

/** Below half the goal is "talk to the teacher" where there are no published bands (our choice). */
const half = (onTrack: number): Goal => ({ onTrack, practice: Math.ceil(onTrack / 2) });

const DIBELS_LNF: Partial<Record<GradeLevel, BySeason>> = {
  K: { fall: { onTrack: 25, practice: 16 }, winter: { onTrack: 37, practice: 31 }, spring: { onTrack: 42, practice: 35 } },
  1: { fall: { onTrack: 42, practice: 32 }, winter: { onTrack: 57, practice: 51 }, spring: { onTrack: 59, practice: 53 } },
};

const PREK_LETTERS_ESTIMATE: BySeason = { fall: half(5), winter: half(10), spring: half(16) };

/** Green and yellow minimums. In the fall almost every kindergartner scores 0–1: no verdict. */
const DIBELS_WRF_K: BySeason = {
  fall: null,
  winter: { onTrack: 4, practice: 1 },
  spring: { onTrack: 10, practice: 6 },
};

const NUMBERS_ESTIMATE: Partial<Record<GradeLevel, BySeason>> = {
  preK: { fall: half(3), winter: half(6), spring: half(10) },
  K: { fall: half(8), winter: half(15), spring: half(22) },
};

/** Rocket Math 2024, written problems per minute, per operation. */
const ROCKET_MATH: Record<Grade, Record<Season, Partial<Record<MathOp, number>>>> = {
  1: { fall: { "+": 12 }, winter: { "+": 25 }, spring: { "+": 25, "-": 12 } },
  2: { fall: { "+": 25 }, winter: { "+": 30, "-": 12 }, spring: { "+": 30, "-": 25 } },
  3: { fall: { "+": 30, "-": 30 }, winter: { "+": 30, "-": 30, "×": 30 }, spring: { "+": 30, "-": 30, "×": 30 } },
  4: {
    fall: { "+": 35, "-": 35, "×": 35 },
    winter: { "+": 35, "-": 35, "×": 35, "÷": 20 },
    spring: { "+": 35, "-": 35, "×": 35, "÷": 35 },
  },
};

const isSchoolGrade = (grade: GradeLevel): grade is Grade => typeof grade === "number";

/** The operations a math check mixes for this grade and season. */
export function mathOpsFor(grade: GradeLevel, season: Season): MathOp[] {
  if (!isSchoolGrade(grade)) return [];
  return Object.keys(ROCKET_MATH[grade][season]) as MathOp[];
}

// ---------------------------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------------------------

/** The norm a result is compared with, or null when there is none (show number and growth only). */
export function normFor(kind: CheckKind, grade: GradeLevel, season: Season): NormUsed | null {
  const make = (goal: Goal | null | undefined, source: NormUsed["source"], sourceName: string): NormUsed | null =>
    goal ? { source, sourceName, grade, season, onTrackMin: goal.onTrack, practiceMin: goal.practice } : null;

  switch (kind) {
    case "passage": {
      if (!isSchoolGrade(grade)) return null;
      const lookup = orfNormsFor(grade, season);
      const v = lookup.values;
      // Same rules as reading/assess.ts: 10+ words below the median needs practice; below the
      // 25th percentile, talk to the teacher. Grade 1 in the fall has no norm, so speed alone
      // never triggers the strongest verdict there.
      return {
        source: "published",
        sourceName: "Hasbrouck & Tindal 2017",
        grade,
        season: lookup.season,
        onTrackMin: v[50] - 9,
        practiceMin: lookup.usedLaterSeason ? 0 : v[25],
        percentiles: { ...v },
      };
    }
    case "wordList":
      return grade === "K" ? make(DIBELS_WRF_K[season], "published", "DIBELS 8 WRF") : null;
    case "letterNaming":
      if (grade === "preK") return make(PREK_LETTERS_ESTIMATE[season], "estimate", "ReadBuddy estimate");
      return make(DIBELS_LNF[grade]?.[season], "published", "DIBELS 8 LNF");
    case "numberNaming":
      return make(NUMBERS_ESTIMATE[grade]?.[season], "estimate", "ReadBuddy estimate");
    case "mathFacts": {
      if (!isSchoolGrade(grade)) return null;
      const goals = Object.values(ROCKET_MATH[grade][season]);
      // A mixed check's goal is the average of its operations' goals (our choice).
      const goal = Math.round(goals.reduce((a, b) => a + b, 0) / goals.length);
      return make(half(goal), "published", "Rocket Math 2024");
    }
  }
}

export function placementFor(perMinute: number, norm: NormUsed | null): Placement {
  if (!norm) return { kind: "none" };
  const p = norm.percentiles;
  if (p && p[10] !== undefined && p[25] !== undefined && p[50] !== undefined && p[75] !== undefined && p[90] !== undefined) {
    if (perMinute < p[10]) return { kind: "percentile", band: "below10" };
    if (perMinute < p[25]) return { kind: "percentile", band: "10to25" };
    if (perMinute < p[50]) return { kind: "percentile", band: "25to50" };
    if (perMinute < p[75]) return { kind: "percentile", band: "50to75" };
    if (perMinute < p[90]) return { kind: "percentile", band: "75to90" };
    return { kind: "percentile", band: "above90" };
  }
  if (perMinute >= norm.onTrackMin) return { kind: "band", band: "green" };
  if (perMinute >= norm.practiceMin) return { kind: "band", band: "yellow" };
  return { kind: "band", band: "red" };
}

/**
 * Speed against the norm; for a passage, accuracy too (under 95% needs practice, under 90% talk to
 * the teacher, as in reading/assess.ts). DIBELS word lists count correct words only.
 */
export function verdictFor(kind: CheckKind, perMinute: number, accuracy: number, norm: NormUsed | null): Verdict | null {
  if (!norm) return null;
  const rank: Verdict[] = ["onTrack", "practice", "talkToTeacher"];
  let v: Verdict = perMinute >= norm.onTrackMin ? "onTrack" : perMinute >= norm.practiceMin ? "practice" : "talkToTeacher";
  if (kind === "passage") {
    const byAccuracy: Verdict = accuracy < 0.9 ? "talkToTeacher" : accuracy < 0.95 ? "practice" : "onTrack";
    if (rank.indexOf(byAccuracy) > rank.indexOf(v)) v = byAccuracy;
  }
  return v;
}

export function isItemCorrect(item: CheckItem): boolean {
  return item.kind === "word" ? item.status === "correct" : item.correct;
}
