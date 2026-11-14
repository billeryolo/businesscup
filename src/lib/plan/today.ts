// What a child does today, and what the assistant says about it on Home. Rules only for now: the
// real plan and the real assistant come from the backend later.

import type { CheckRecord } from "@/lib/store/checks";
import { archetypeFor, type Kid, minutesFor } from "@/lib/store/family";

export type Activity = { id: "hear-a-letter" | "big-word" | "speed-math" | "story"; title: string; emoji: string; tone: string; minutes: number };

const GAMES: Record<Activity["id"], Omit<Activity, "minutes">> = {
  "hear-a-letter": { id: "hear-a-letter", title: "Hear a letter", emoji: "🔤", tone: "bg-mint" },
  "big-word": { id: "big-word", title: "Big word", emoji: "📖", tone: "bg-lilac" },
  "speed-math": { id: "speed-math", title: "Speed math", emoji: "⚡", tone: "bg-peach" },
  story: { id: "story", title: "Story about…", emoji: "🦄", tone: "bg-candy" },
};

/** Three short games that add up to the day's minutes: letters first for the youngest, reading for the oldest. */
export function todayFor(kid: Kid): Activity[] {
  const ids: Activity["id"][] = { explorer: ["hear-a-letter", "speed-math", "story"], builder: ["hear-a-letter", "big-word", "speed-math"], reader: ["big-word", "speed-math", "story"] }[
    archetypeFor(kid.grade)
  ] as Activity["id"][];
  const total = minutesFor(kid.grade);
  const each = Math.floor(total / ids.length);
  return ids.map((id, i) => ({ ...GAMES[id], minutes: i === 0 ? total - each * (ids.length - 1) : each }));
}

const KIND_GAME = { reading: "Big word", math: "Speed math", letters: "Hear a letter" } as const;

/** One or two sentences for the assistant card on Home, based on the latest check. */
export function assistantNote(kid: Kid, latest: CheckRecord | undefined): string {
  if (!latest) return `Hi! Do a 1-minute check and I’ll shape ${kid.name}’s plan around it.`;
  const game = KIND_GAME[latest.kind];
  if (latest.verdict === "onTrack") return `${kid.name} is on track in ${latest.kind}: ${latest.score} a minute. Keep the ${minutesFor(kid.grade)} minutes a day going.`;
  if (latest.verdict === "practice") return `${kid.name} scored ${latest.score} in ${latest.kind}; we’re aiming for ${latest.target}. A few minutes of ${game} today will help.`;
  return `${kid.name}’s ${latest.kind} check is worth showing to the teacher. I can help you write the note.`;
}
