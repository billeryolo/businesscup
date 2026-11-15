// What the assistant can do, not just say. After each answer the phone reads the parent's
// message and adds action cards under the reply: save a note to the diary, log reading time, open
// a game, propose a change to the daily minutes (Apply / Not now), show a mini chart, or open the
// teacher report. Rules on the phone, so the actions work with or without the AI, and nothing
// changes without the parent seeing it (saved notes can be undone; changes need Apply).

import type { CheckKind, CheckRecord } from "@/lib/store/checks";

export type Card =
  | { kind: "diary"; text: string; entryId?: string; undone?: boolean }
  | { kind: "minutes"; minutes: number; entryId?: string; undone?: boolean }
  | { kind: "open"; label: string; href: string }
  | { kind: "change"; from: number; to: number; status: "pending" | "applied" | "declined" }
  | { kind: "chart"; label: string; scores: number[]; target: number; change: string | null }
  | { kind: "report" };

const UNIT: Record<CheckKind, string> = { reading: "words a minute", math: "facts a minute", letters: "letters a minute" };

function gameFor(text: string): { label: string; href: string } | null {
  if (/\b(letters?|[a-z] and [a-z]|alphabet|sounds?)\b/i.test(text)) return { label: "Open Hear a letter", href: "/play/hear-a-letter" };
  if (/\b(math|numbers?|adding|add|subtract|times|facts?|count(ing)?)\b/i.test(text)) return { label: "Open Speed math", href: "/play/speed-math" };
  if (/\b(read(ing)?|words?|syllables?|sound(ing)? out|spell(ing)?)\b/i.test(text)) return { label: "Open Big word", href: "/play/big-word" };
  return null;
}

/** The cards for one parent message. `minutes` is the child's current daily practice. */
export function cardsFor(message: string, ctx: { checks: CheckRecord[]; minutes: number }): Card[] {
  const text = message.trim();
  const cards: Card[] = [];

  const read = /\b(read|practi[cs]ed|played|did)\b[^.?!]*?\b(\d{1,3})\s*(min|mins|minutes)\b/i.exec(text);
  if (read) cards.push({ kind: "minutes", minutes: Math.min(180, Number(read[2])) });

  if (/\b(mix(es|ed|ing)? up|confus\w*|struggl\w*|trouble|hard time|can'?t|cannot|difficult|stuck|guess(es|ed|ing)?|skips?|skipping)\b/i.test(text)) {
    cards.push({ kind: "diary", text });
    const game = gameFor(text);
    if (game) cards.push({ kind: "open", ...game });
  }

  if (/\b(shorter|less time|fewer minutes|too long|cut (it|practice) down)\b/i.test(text)) {
    const to = Math.max(5, ctx.minutes - 5);
    if (to !== ctx.minutes) cards.push({ kind: "change", from: ctx.minutes, to, status: "pending" });
  } else if (/\b(longer|more time|more minutes|more practice)\b/i.test(text)) {
    const to = Math.min(30, ctx.minutes + 5);
    if (to !== ctx.minutes) cards.push({ kind: "change", from: ctx.minutes, to, status: "pending" });
  }

  if (/\b(how (is|was|did|'?s)|doing|progress|this week|improv\w*|growing|getting better|behind)\b/i.test(text) && ctx.checks.length) {
    const latest = ctx.checks[0];
    const mine = ctx.checks.filter((c) => c.kind === latest.kind).slice(0, 6).reverse();
    const change = mine.length > 1 ? `${mine[mine.length - 1].score - mine[0].score >= 0 ? "+" : ""}${mine[mine.length - 1].score - mine[0].score} since ${new Date(mine[0].at).toLocaleDateString("en", { month: "short", day: "numeric" })}` : null;
    cards.push({ kind: "chart", label: UNIT[latest.kind], scores: mine.map((c) => c.score), target: latest.target, change });
  }

  if (/\bteacher\b/i.test(text) && /\b(note|write|email|message|tell|send|report|show)\b/i.test(text)) cards.push({ kind: "report" });

  return cards;
}
