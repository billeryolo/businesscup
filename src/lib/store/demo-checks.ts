// Past checks for "Try with a demo family": four weekly reading checks and two math checks for
// Mia (grade 2), two letter checks for Leo (Pre-K). Dated back from today, with targets and
// verdicts from the same norms and goals as real checks, so Home and Progress have a story to tell.

import { quickLevel } from "@/lib/checks/quick";
import type { Verdict } from "@/lib/reading/assess";
import { needsFluencyBuilding, normsFor, seasonFor } from "@/lib/reading/norms";
import type { CheckRecord } from "./checks";

const daysAgo = (now: Date, days: number, hour = 18) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d;
};

/** Same rules as reading/assess.ts, from the score and accuracy alone. */
function readingVerdict(wcpm: number, accuracy: number, at: Date): { target: number; verdict: Verdict } {
  const norms = normsFor(2, seasonFor(at));
  let verdict: Verdict = "onTrack";
  if (needsFluencyBuilding(wcpm, norms.values) || accuracy < 0.95) verdict = "practice";
  if ((!norms.usedLaterSeason && wcpm < norms.values[25]) || accuracy < 0.9) verdict = "talkToTeacher";
  return { target: norms.values[50], verdict };
}

export function demoChecks(now: Date, kidIds: { mia: string; leo: string }): CheckRecord[] {
  const reading = ([days, score, accuracy]: [number, number, number], i: number): CheckRecord => {
    const at = daysAgo(now, days);
    return { id: `demo-reading-${i}`, kidId: kidIds.mia, kind: "reading", at: at.toISOString(), score, accuracy, ...readingVerdict(score, accuracy, at) };
  };
  const quick = (id: string, kidId: string, grade: -1 | 2, kind: "math" | "letters", days: number, score: number, accuracy: number): CheckRecord => {
    const at = daysAgo(now, days, 17);
    const goal = quickLevel(kind, grade, at).goal;
    return { id, kidId, kind, at: at.toISOString(), score, accuracy, target: goal, verdict: score >= goal ? "onTrack" : "practice" };
  };

  // Mia's reading: 36 → 39 → 41 → 47 words a minute, getting more accurate each week.
  const miaReading = ([[28, 36, 0.9], [21, 39, 0.93], [14, 41, 0.93], [7, 47, 0.96]] as [number, number, number][]).map(reading);

  return [
    ...miaReading,
    quick("demo-math-1", kidIds.mia, 2, "math", 20, 14, 0.82),
    // Older than the last reading check, so Home opens on Mia's reading success.
    quick("demo-math-2", kidIds.mia, 2, "math", 9, 18, 0.9),
    quick("demo-letters-1", kidIds.leo, -1, "letters", 25, 6, 0.6),
    quick("demo-letters-2", kidIds.leo, -1, "letters", 8, 10, 0.77),
  ].sort((a, b) => b.at.localeCompare(a.at)); // newest first, like the store
}
