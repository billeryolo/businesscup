// Oral reading fluency norms: words correct per minute (WCPM) by grade, season and percentile.
// Source: Hasbrouck & Tindal (2017), "An Update to Compiled ORF Norms", Technical Report 1702,
// Behavioral Research and Teaching, University of Oregon. Grade 1 has no fall norm.

export type Grade = 1 | 2 | 3 | 4;
export type Season = "fall" | "winter" | "spring";
export type Percentile = 10 | 25 | 50 | 75 | 90;

export const GRADES: Grade[] = [1, 2, 3, 4];
export const PERCENTILES: Percentile[] = [10, 25, 50, 75, 90];

type SeasonNorms = Record<Percentile, number>;

export const ORF_NORMS_2017: Record<Grade, Partial<Record<Season, SeasonNorms>>> = {
  1: {
    winter: { 90: 97, 75: 59, 50: 29, 25: 16, 10: 9 },
    spring: { 90: 116, 75: 91, 50: 60, 25: 34, 10: 18 },
  },
  2: {
    fall: { 90: 111, 75: 84, 50: 50, 25: 36, 10: 23 },
    winter: { 90: 131, 75: 109, 50: 84, 25: 59, 10: 35 },
    spring: { 90: 148, 75: 124, 50: 100, 25: 72, 10: 43 },
  },
  3: {
    fall: { 90: 134, 75: 104, 50: 83, 25: 59, 10: 40 },
    winter: { 90: 161, 75: 137, 50: 97, 25: 79, 10: 62 },
    spring: { 90: 166, 75: 139, 50: 112, 25: 91, 10: 63 },
  },
  4: {
    fall: { 90: 153, 75: 125, 50: 94, 25: 75, 10: 60 },
    winter: { 90: 168, 75: 143, 50: 120, 25: 95, 10: 71 },
    spring: { 90: 184, 75: 160, 50: 133, 25: 105, 10: 83 },
  },
};

/** US school-year seasons: fall Aug–Nov, winter Dec–Feb, spring Mar–Jul. */
export function seasonFor(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 8 && month <= 11) return "fall";
  if (month === 12 || month <= 2) return "winter";
  return "spring";
}

export type NormLookup = {
  /** The season actually compared against (grade 1 in the fall uses the winter norms). */
  season: Season;
  /** True when the requested season had no norms and a later one was used as the target. */
  usedLaterSeason: boolean;
  values: SeasonNorms;
};

export function normsFor(grade: Grade, season: Season): NormLookup {
  const byGrade = ORF_NORMS_2017[grade];
  const exact = byGrade[season];
  if (exact) return { season, usedLaterSeason: false, values: exact };
  return { season: "winter", usedLaterSeason: true, values: byGrade.winter! };
}

export type PercentileBand = "below 10th" | "10th–25th" | "25th–50th" | "50th–75th" | "75th–90th" | "above 90th";

export function percentileBand(wcpm: number, values: SeasonNorms): PercentileBand {
  if (wcpm < values[10]) return "below 10th";
  if (wcpm < values[25]) return "10th–25th";
  if (wcpm < values[50]) return "25th–50th";
  if (wcpm < values[75]) return "50th–75th";
  if (wcpm < values[90]) return "75th–90th";
  return "above 90th";
}

/**
 * Hasbrouck & Tindal: students scoring 10 or more words below the 50th percentile benefit
 * from a fluency-building program.
 */
export function needsFluencyBuilding(wcpm: number, values: SeasonNorms): boolean {
  return wcpm <= values[50] - 10;
}

/**
 * Expected average weekly growth, as the norms authors suggest: fall-to-spring difference over
 * 32 weeks (grade 1: winter-to-spring over 16 weeks), at the 50th percentile.
 */
export function expectedWeeklyGrowth(grade: Grade): number {
  const g = ORF_NORMS_2017[grade];
  if (grade === 1) return (g.spring![50] - g.winter![50]) / 16;
  return (g.spring![50] - g.fall![50]) / 32;
}
