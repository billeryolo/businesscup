// The parent's assistant: what it knows about the child, how the child's name is kept on the
// phone, and the built-in answers used whenever the AI is not available.

import { z } from "zod";
import type { Card } from "./actions";
import { todayFor } from "@/lib/plan/today";
import type { CheckRecord } from "@/lib/store/checks";
import { gradeLabel, type Kid, kidMinutes } from "@/lib/store/family";

export const CHILD = "{{child}}";

export type ChatMessage = { role: "user" | "assistant"; text: string; cards?: Card[] };

export const FactsShape = z.object({
  grade: z.string().max(20),
  minutes: z.number().int().min(0).max(120),
  stars: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  today: z.array(z.string().max(40)).max(6),
  checks: z
    .array(
      z.object({
        kind: z.enum(["reading", "math", "letters"]),
        score: z.number(),
        target: z.number(),
        accuracyPercent: z.number().int().min(0).max(100),
        verdict: z.enum(["onTrack", "practice", "talkToTeacher"]),
        daysAgo: z.number().int().min(0),
      }),
    )
    .max(5),
});
export type AssistantFacts = z.infer<typeof FactsShape>;

/** What the assistant is told about the child. No name: the phone keeps that. */
export function factsFor(kid: Kid, checks: CheckRecord[], now = Date.now()): AssistantFacts {
  return {
    grade: gradeLabel(kid.grade),
    minutes: kidMinutes(kid),
    stars: kid.stars,
    streakDays: kid.streakDays,
    today: todayFor(kid).map((a) => a.title),
    checks: checks.slice(0, 5).map((c) => ({
      kind: c.kind,
      score: c.score,
      target: c.target,
      accuracyPercent: Math.round(c.accuracy * 100),
      verdict: c.verdict,
      daysAgo: Math.max(0, Math.floor((now - new Date(c.at).getTime()) / 86_400_000)),
    })),
  };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Swaps the child's name for the placeholder before anything is sent. */
export function hideName(text: string, name: string): string {
  const clean = name.trim();
  if (!clean) return text;
  return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escape(clean)}(?![\\p{L}\\p{N}])`, "giu"), CHILD);
}

/** Puts the name back where the placeholder is. */
export const showName = (text: string, name: string) => text.split(CHILD).join(name);

export function suggestionsFor(name: string): { label: string; ask: string; icon: "star" | "bolt" | "book" | "wand" }[] {
  return [
    { label: `How is ${name} doing?`, ask: `How is ${name} doing?`, icon: "star" },
    { label: "What to practice tonight", ask: `What should ${name} and I practice tonight?`, icon: "bolt" },
    { label: "Explain the last check", ask: "What does the last check mean?", icon: "book" },
    { label: "Make practice fun", ask: `${name} does not want to practice. How do I make it fun?`, icon: "wand" },
  ];
}

const UNIT = { reading: "words a minute", math: "facts a minute", letters: "letters a minute" } as const;
const when = (days: number) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`);

/** A plain answer built from the facts alone. Uses the placeholder for the child's name. */
export function rulesReply(question: string, facts: AssistantFacts): string {
  const q = question.toLowerCase();
  const latest = facts.checks[0];
  const plan = facts.today.length ? facts.today.map((t) => t.replace(/…$/, "")).join(", ") : "a short game";

  const explain = () => {
    if (!latest) return `There is no 1-minute check yet. Start one from Home: it takes a minute and shows where ${CHILD} is today.`;
    const gap = latest.target - latest.score;
    const place =
      latest.verdict === "onTrack"
        ? `That is at or above the goal of ${latest.target} for ${facts.grade}.`
        : latest.verdict === "practice"
          ? `The goal for ${facts.grade} is ${latest.target}, so ${CHILD} is ${gap} short. That is a normal gap to close with daily practice.`
          : `The goal for ${facts.grade} is ${latest.target}. A gap this size is worth showing to the teacher. It is not a diagnosis.`;
    return `The last ${latest.kind} check was ${when(latest.daysAgo)}: ${latest.score} ${UNIT[latest.kind]}, with ${latest.accuracyPercent}% correct. ${place}`;
  };

  if (/teacher|note|email/.test(q)) {
    if (!latest) return `Do a 1-minute check first, then I can turn the numbers into a short note for the teacher.`;
    return `Here is a note you can send:\n\n“Hello, we did a 1-minute ${latest.kind} check at home. ${CHILD} scored ${latest.score} ${UNIT[latest.kind]} with ${latest.accuracyPercent}% correct; the goal we use for ${facts.grade} is ${latest.target}. We practice ${facts.minutes} minutes a day. Is this what you see in class, and what would you focus on?”`;
  }
  if (/fun|bored|boring|motivat|refus|want to|hate|tired|cry|cries|tears|upset|frustrat|gives? up|fight/.test(q)) {
    return `A few things that usually help:\n\n- Keep it to ${facts.minutes} minutes and stop while it is still going well.\n- Let ${CHILD} pick the first game. Story about… is a good opener.\n- Sit next to ${CHILD} and take turns: you do one, ${CHILD} does one.\n- Count the stars together at the end. ${CHILD} has ${facts.stars} so far.\n\nSame time every day works better than a long session once a week.`;
  }
  if (/practi|tonight|today|plan|what should|next/.test(q)) {
    const focus = latest && latest.verdict !== "onTrack" ? ` Start with ${latest.kind}: the last check was ${latest.score} against a goal of ${latest.target}.` : "";
    return `Today’s plan is ${facts.minutes} minutes: ${plan}.${focus}\n\nPlay the games in that order, and finish with a page of any book ${CHILD} likes, read aloud together.`;
  }
  if (/check|score|result|mean|number|norm/.test(q)) return explain();
  if (/how is|doing|progress|going|well|behind|ahead/.test(q)) {
    const streak = facts.streakDays > 1 ? ` and a ${facts.streakDays}-day streak` : "";
    return `${CHILD} has ${facts.stars} stars${streak}. ${explain()}\n\nToday’s plan: ${plan}.`;
  }
  return `I can help with ${CHILD}’s reading, letters and math at home. Ask me how ${CHILD} is doing, what to practice tonight, what a check result means, or how to make practice easier.\n\n${explain()}`;
}
