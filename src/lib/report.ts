// The one-page report a parent can hand to the teacher: what was measured at home, against which
// published benchmark, how it changed, how much practice happened, and what to ask. Built from
// the checks saved on this phone. A screening summary, never a diagnosis.

import { quickLevel } from "@/lib/checks/quick";
import { VERDICT_LABEL } from "@/lib/checks/result";
import { progressFor } from "@/lib/progress";
import { dayKey, roadmapFor } from "@/lib/roadmap";
import type { CheckKind, CheckRecord } from "@/lib/store/checks";
import { gradeLabel, type Kid } from "@/lib/store/family";

const DAY_MS = 86_400_000;

export const AREA: Record<CheckKind, { title: string; unit: string; measure: string }> = {
  reading: {
    title: "Reading aloud",
    unit: "words correct per minute",
    measure: "1-minute oral reading of an unpractised grade-level story (words correct per minute and accuracy)",
  },
  letters: { title: "Letter names", unit: "letters per minute", measure: "1-minute letter naming, the parent marking each answer" },
  math: { title: "Math facts", unit: "facts per minute", measure: "1-minute math fact fluency, typed answers" },
};

export type ReportArea = {
  kind: CheckKind;
  title: string;
  unit: string;
  measure: string;
  latest: { date: string; score: number; accuracyPercent: number; verdict: string };
  /** The comparison number and where it comes from. */
  benchmark: { value: number; source: string };
  /** e.g. "+11 words a minute in 3 weeks"; null with a single check. */
  change: string | null;
  history: { date: string; score: number; accuracyPercent: number; verdict: string }[];
  needsAttention: boolean;
};

export type TeacherReport = {
  childName: string;
  grade: string;
  madeOn: string;
  areas: ReportArea[];
  practice: { daysLast4Weeks: number; streak: number };
  goal: string | null;
  questions: string[];
};

const fmt = (iso: string | Date) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function benchmarkFor(kid: Kid, c: CheckRecord): { value: number; source: string } {
  if (c.kind === "reading") return { value: c.target, source: "50th percentile for the grade and season, Hasbrouck & Tindal (2017) oral reading fluency norms" };
  const level = quickLevel(c.kind, kid.grade, new Date(c.at));
  return {
    value: c.target,
    source: level.source === "DIBELS 8" ? "DIBELS 8 letter naming benchmark goal for the season" : level.source === "Rocket Math" ? "Rocket Math fact fluency benchmark for the grade and season" : "the app's practice goal (no published per-minute benchmark at this age)",
  };
}

/** `checks` come newest first, as the store gives them. */
export function teacherReport(kid: Kid, checks: CheckRecord[], now: Date): TeacherReport {
  const kinds: CheckKind[] = ["reading", "letters", "math"];
  const areas: ReportArea[] = kinds.flatMap((kind) => {
    const mine = checks.filter((c) => c.kind === kind);
    if (!mine.length) return [];
    const latest = mine[0];
    const progress = progressFor(mine, kind);
    const row = (c: CheckRecord) => ({ date: fmt(c.at), score: c.score, accuracyPercent: Math.round(c.accuracy * 100), verdict: VERDICT_LABEL[c.verdict] });
    return [
      {
        kind,
        ...AREA[kind],
        latest: row(latest),
        benchmark: benchmarkFor(kid, latest),
        change: progress.summary,
        history: mine.slice(0, 6).map(row),
        needsAttention: latest.verdict !== "onTrack",
      },
    ];
  });

  const since = now.getTime() - 28 * DAY_MS;
  const practiced = (kid.practiced ?? []).filter((d) => new Date(`${d}T12:00:00`).getTime() >= since && d <= dayKey(now));
  const path = roadmapFor(kid, checks, now);

  const questions: string[] = [];
  const reading = areas.find((a) => a.kind === "reading");
  if (reading?.needsAttention) questions.push(`Does ${kid.name}'s reading in class look like this at-home result? Would a classroom reading screener be useful?`);
  if (reading && reading.latest.accuracyPercent < 95) questions.push("Which decoding skills (letter sounds, blending, word endings) should we practise at home?");
  if (areas.some((a) => a.kind !== "reading" && a.needsAttention)) questions.push(`Which ${areas.find((a) => a.kind !== "reading" && a.needsAttention)!.kind === "math" ? "math facts" : "letters"} should we focus on at home?`);
  questions.push(`Is there anything you'd like us to practise at home with ${kid.name}?`);

  return {
    childName: kid.name,
    grade: gradeLabel(kid.grade),
    madeOn: fmt(now),
    areas,
    practice: { daysLast4Weeks: practiced.length, streak: kid.streakDays },
    goal: path ? `${path.start} → ${path.goal} ${path.unit} by the end of a 4-week practice path (day ${path.today} of 28)` : null,
    questions,
  };
}

/** The same report as plain text, for sharing in a message or email. */
export function reportText(r: TeacherReport): string {
  const lines = [`At-home reading and math check: ${r.childName} (${r.grade}), ${r.madeOn}`, ""];
  for (const a of r.areas) {
    lines.push(`${a.title}: ${a.latest.score} ${a.unit}, ${a.latest.accuracyPercent}% correct (${a.latest.date}). Benchmark ${a.benchmark.value}: ${a.benchmark.source}. ${a.latest.verdict}.${a.change ? ` Change: ${a.change}.` : ""}`);
  }
  lines.push("", `Practice: ${r.practice.daysLast4Weeks} days in the last 4 weeks.${r.goal ? ` Current goal: ${r.goal}.` : ""}`);
  lines.push("", "Questions for you:", ...r.questions.map((q) => `- ${q}`));
  lines.push("", "This is an at-home screening with ReadBuddy, run by a parent. It is not a diagnosis.");
  return lines.join("\n");
}
