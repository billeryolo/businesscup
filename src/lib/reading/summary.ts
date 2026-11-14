// The parent-facing write-up. Written by Claude when it's configured; otherwise by these rules.
// Either way it only explains the measured result and never names a diagnosis.

import type { Assessment, Verdict } from "./assess";
import { expectedWeeklyGrowth } from "./norms";
import { PATTERN_COPY } from "./patterns";

export type ParentSummary = {
  headline: string;
  meaning: string;
  focus: { title: string; why: string; tonight: string }[];
  plan: { week: number; goal: string; daily: string }[];
  teacherNote: string;
  source: "ai" | "rules";
};

/** The facts both writers work from, safe to send to the model. */
export type SummaryFacts = {
  childName: string;
  grade: number;
  season: string;
  usedLaterSeason: boolean;
  wcpm: number;
  accuracyPercent: number;
  median: number;
  percentile25: number;
  band: string;
  gapToMedian: number;
  verdict: Verdict;
  patterns: { title: string; seen: string; tip: string; examples: string[] }[];
  weeklyGrowth: number;
};

export function summaryFacts(childName: string, a: Assessment): SummaryFacts {
  return {
    childName: childName.trim() || "Your child",
    grade: a.grade,
    season: a.norms.season,
    usedLaterSeason: a.norms.usedLaterSeason,
    wcpm: a.score.wcpm,
    accuracyPercent: Math.round(a.score.accuracy * 100),
    median: a.norms.values[50],
    percentile25: a.norms.values[25],
    band: a.band,
    gapToMedian: a.gapToMedian,
    verdict: a.verdict,
    patterns: a.patterns.map((p) => ({
      ...PATTERN_COPY[p.id],
      examples: p.examples.map((e) => (e.heard ? `"${e.word}" read as "${e.heard}"` : `"${e.word}"`)),
    })),
    weeklyGrowth: Math.round(expectedWeeklyGrowth(a.grade as 1 | 2 | 3 | 4) * 10) / 10,
  };
}

const ordinal = (n: number) => ["", "1st", "2nd", "3rd", "4th"][n] ?? `${n}th`;

export function rulesSummary(f: SummaryFacts): ParentSummary {
  const gradeLabel = `${ordinal(f.grade)} grade`;
  const when = f.usedLaterSeason ? `the winter target for ${gradeLabel}` : `${gradeLabel} in the ${f.season}`;
  const paceBehind = f.wcpm <= f.median - 10;
  const wellBehind = !f.usedLaterSeason && f.wcpm < f.percentile25;
  const accuracyLow = f.accuracyPercent < 95;

  let headline = `${f.childName} is reading at a typical pace for ${when}.`;
  if (f.verdict !== "onTrack") {
    if (wellBehind) headline = `${f.childName} is reading well below the typical pace for ${when}.`;
    else if (paceBehind && accuracyLow) headline = `${f.childName} is reading a little below the typical pace for ${when}, and misreads some words.`;
    else if (paceBehind) headline = `${f.childName} is reading a little below the typical pace for ${when}.`;
    else headline = `${f.childName} reads at a good pace for ${when}, but gets ${f.accuracyPercent < 90 ? "many" : "some"} words wrong.`;
  }

  const pace = `${f.childName} read ${f.wcpm} words correctly in one minute, with ${f.accuracyPercent}% of words right. The typical (middle) score for ${when} is ${f.median}.`;
  const why = paceBehind
    ? "Children 10 or more words below the middle usually catch up with a few minutes of focused practice each day."
    : "Speed is fine; the practice should go into reading each word carefully rather than faster.";
  const meaning = {
    onTrack: `${pace} Keep reading together every day; a re-check in a month will show the growth.`,
    practice: `${pace} ${why}`,
    talkToTeacher: `${pace} This is worth a conversation with the teacher. It is not a diagnosis, but it is a good reason to ask what support the school can offer, and to practice at home in the meantime.`,
  }[f.verdict];

  const fallbackFocus = accuracyLow
    ? { title: "Read each word carefully", seen: "A few words were read wrong, without one clear pattern.", tip: "Read together and point at each word. When a word comes out wrong, go back and sound it out together.", examples: [] }
    : { title: "Keep the habit", seen: "No clear mistake pattern in this reading.", tip: "Read aloud together for 10 minutes a day and let your child pick the book.", examples: [] };
  const focus = (f.patterns.length ? f.patterns : [fallbackFocus])
    .slice(0, 2)
    .map((p) => ({ title: p.title, why: p.examples.length ? `${p.seen} For example: ${p.examples.join(", ")}.` : p.seen, tonight: p.tip }));

  const target = Math.max(f.median, f.wcpm + Math.round(f.weeklyGrowth * 4));
  const plan = [
    { week: 1, goal: "Warm up and set a baseline", daily: "10 minutes: read one short passage three times in a row. Note how long each read takes." },
    { week: 2, goal: focus[0].title, daily: `10 minutes: ${focus[0].tonight}` },
    { week: 3, goal: "Build speed on easy text", daily: "10 minutes: re-read a favorite book aloud, then one new page." },
    { week: 4, goal: `Re-check: aim for about ${target} words a minute`, daily: "Keep the routine, then do a new one-minute check at the end of the week." },
  ];

  const teacherNote = `At home, ${f.childName} read a ${gradeLabel} passage aloud for one minute: ${f.wcpm} words correct per minute, ${f.accuracyPercent}% accuracy (compared with the Hasbrouck & Tindal 2017 norms, ${f.band} percentile band). ${f.patterns.length ? `We noticed: ${f.patterns.map((p) => p.title.toLowerCase()).join("; ")}. ` : ""}Could we talk about how ${f.childName} is doing in class?`;

  return { headline, meaning, focus, plan, teacherNote, source: "rules" };
}
