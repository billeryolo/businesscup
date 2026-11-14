// Turns a finished check into what the result screen shows. Reading goes through the published
// norms and the existing parent summary; math and letters compare with the app's practice goal.

import type { Assessment, Verdict } from "@/lib/reading/assess";
import { rulesSummary, summaryFacts } from "@/lib/reading/summary";
import type { CheckKind } from "@/lib/store/checks";
import { type Grade, gradeLabel } from "@/lib/store/family";
import { type QuickKind, quickLevel } from "./quick";

export type QuickResult = {
  kind: QuickKind;
  /** Correct per minute. */
  score: number;
  correct: number;
  attempted: number;
  seconds: number;
  /** Prompts answered wrong, in order, without repeats. */
  missed: string[];
};

export type ResultView = {
  kind: CheckKind;
  score: number;
  unit: string;
  accuracy: number;
  target: number;
  verdict: Verdict;
  headline: string;
  meaning: string;
  /** The bar that places the score: coloured zones up to `max`, with labelled ticks. */
  bar: { max: number; zones: { to: number; tone: "low" | "mid" | "good" }[]; ticks: { at: number; label: string }[]; source: string };
  noticed: { title: string; why: string; tonight: string }[];
  plan: { week: number; goal: string; daily: string }[];
  teacherNote: string;
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  onTrack: "On track",
  practice: "Needs practice",
  talkToTeacher: "Talk to the teacher",
};

export function readingView(name: string, a: Assessment): ResultView {
  const summary = rulesSummary(summaryFacts(name, a));
  const v = a.norms.values;
  return {
    kind: "reading",
    score: a.score.wcpm,
    unit: "words read correctly in a minute",
    accuracy: a.score.accuracy,
    target: v[50],
    verdict: a.verdict,
    headline: summary.headline,
    meaning: summary.meaning,
    bar: {
      max: Math.max(v[90] * 1.1, a.score.wcpm + 10),
      zones: [
        { to: v[25], tone: "low" },
        { to: v[50], tone: "mid" },
        { to: Infinity, tone: "good" },
      ],
      ticks: [
        { at: v[25], label: "25th" },
        { at: v[50], label: "typical" },
        { at: v[75], label: "75th" },
      ],
      source: "Compared with US oral reading norms (Hasbrouck & Tindal, 2017).",
    },
    noticed: summary.focus,
    plan: summary.plan,
    teacherNote: summary.teacherNote,
  };
}

export function quickView(name: string, grade: Grade, r: QuickResult): ResultView {
  const { label, goal } = quickLevel(r.kind, grade);
  const math = r.kind === "math";
  const thing = math ? "facts" : "letters";
  const reached = r.score >= goal;
  const accuracy = r.attempted ? r.correct / r.attempted : 0;
  const game = math ? "Speed math" : "Hear a letter";

  const noticed = r.missed.length
    ? [
        {
          title: math ? "A few facts to practice" : "A few letters to practice",
          why: `Not yet sure: ${r.missed.slice(0, 8).join(", ")}.`,
          tonight: math ? "Pick two of these facts and say them together a few times, with fingers or blocks." : "Pick two of these letters. Find them on a book cover or a cereal box and name them together.",
        },
      ]
    : [{ title: "No misses", why: `Every answer was right. The next step is speed.`, tonight: `Play ${game} for five minutes.` }];

  return {
    kind: r.kind,
    score: r.score,
    unit: math ? "facts answered in a minute" : "letters named in a minute",
    accuracy,
    target: goal,
    verdict: reached ? "onTrack" : "practice",
    headline: reached ? `${name} reached the goal for ${label}.` : `${name} is building up ${label}.`,
    meaning: `${name} got ${r.correct} of ${r.attempted} right, which is ${r.score} ${thing} a minute. Our practice goal for ${gradeLabel(grade)} is ${goal}. ${
      reached ? "Keep the habit and check again in a month." : "A few minutes a day usually closes this gap within weeks."
    }`,
    bar: {
      max: Math.max(goal * 1.5, r.score + 3),
      zones: [
        { to: goal, tone: "mid" },
        { to: Infinity, tone: "good" },
      ],
      ticks: [{ at: goal, label: "goal" }],
      source: "Compared with this app's practice goal. There is no single national norm for this check.",
    },
    noticed,
    plan: [
      { week: 1, goal: "Make it a habit", daily: `5 minutes of ${game}, same time every day.` },
      { week: 2, goal: noticed[0].title, daily: `5 minutes: ${noticed[0].tonight}` },
      { week: 3, goal: "Build speed", daily: `5 minutes of ${game}. Try to beat yesterday's stars.` },
      { week: 4, goal: `Re-check: aim for ${Math.max(goal, r.score + 3)} a minute`, daily: "Keep the routine, then do a new 1-minute check at the end of the week." },
    ],
    teacherNote: `At home, ${name} (${gradeLabel(grade)}) did a one-minute check on ${label}: ${r.score} correct per minute, ${r.correct} of ${r.attempted} right.${
      r.missed.length ? ` Not yet sure: ${r.missed.slice(0, 8).join(", ")}.` : ""
    } Could we talk about how ${name} is doing in class?`,
  };
}
