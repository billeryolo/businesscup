// "Try with a demo family": Mia (grade 2) and Leo (Pre-K) with about four weeks of history, so
// every screen has something real to show the moment the app opens. Dates are relative to now.
// Results go through the same scoring as real checks, so verdicts and bars are consistent.

import { buildResult } from "@/lib/checks/result";
import { addDays, dateKey } from "@/lib/dates";
import { makePlan } from "@/lib/plan";
import { passageById, passageWords } from "@/lib/reading/passages";
import type { AppData, CheckItem, CheckResult, Child, DiaryEntry, PatternId, PracticeSession } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

const MIA = "demo-mia";
const LEO = "demo-leo";

/** A local time on a day n days ago. */
function at(now: Date, daysAgo: number, hour = 18, minute = 30): Date {
  const d = addDays(now, -daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** A word that sounds like a child dropping the ending ("jumped" → "jump"). */
function droppedEnding(word: string): string {
  const cut = word.replace(/(ing|ed|es|s)$/, "");
  return cut !== word && cut.length >= 2 ? cut : word.slice(0, -1) || word;
}

/** The first `correct + errors` words of a passage, with misreads spread evenly. */
function readingItems(textId: string, correct: number, errors: number): CheckItem[] {
  const passage = passageById(textId);
  if (!passage) throw new Error(`No passage ${textId}`);
  const words = passageWords(passage);
  const attempted = Math.min(words.length, correct + errors);
  const misread = spread(attempted, errors);
  return words.slice(0, attempted).map((w, index) => {
    const t = Math.round(((index + 1) / attempted) * 600) / 10;
    return misread.has(index)
      ? { kind: "word", index, text: w.display, status: "misread", heard: droppedEnding(w.norm), t }
      : { kind: "word", index, text: w.display, status: "correct", t };
  });
}

/** `count` positions spread evenly over `total` items. */
function spread(total: number, count: number): Set<number> {
  const step = Math.floor(total / (count + 1));
  return new Set(Array.from({ length: count }, (_, i) => (i + 1) * step));
}

function additionItems(right: number, wrong: number): CheckItem[] {
  const misses = spread(right + wrong, wrong);
  return Array.from({ length: right + wrong }, (_, i) => {
    const a = (i * 7) % 10;
    const b = (i * 3 + 2) % 10;
    const ok = !misses.has(i);
    return { kind: "fact" as const, op: "+" as const, a, b, answer: a + b, given: ok ? a + b : a + b + 1, correct: ok, ms: 2500 };
  });
}

const LETTERS = "s m a t p o c i n d r e b h u l g f w k y j v z x q".split(" ");

function letterItems(right: number, wrong: number): CheckItem[] {
  return Array.from({ length: right + wrong }, (_, i) => ({
    kind: "letter" as const,
    shown: LETTERS[i % LETTERS.length].toUpperCase(),
    correct: i < right,
  }));
}

function numberItems(right: number, wrong: number): CheckItem[] {
  return Array.from({ length: right + wrong }, (_, i) => ({ kind: "number" as const, shown: ((i * 3) % 10) + 1, correct: i < right }));
}

export function demoFamily(now: Date, deviceId: string): AppData {
  const created = at(now, 30, 17, 0).toISOString();
  const mia: Child = { id: MIA, firstName: "Mia", grade: 2, avatar: "fox", minutesPerDay: { weekday: 10, weekend: 10 }, createdAt: created };
  const leo: Child = { id: LEO, firstName: "Leo", grade: "preK", avatar: "bear", minutesPerDay: { weekday: 5, weekend: 5 }, createdAt: created };

  const reading = (id: string, daysAgo: number, textId: string, correct: number, errors: number, patterns: PatternId[]) =>
    buildResult({
      id,
      childId: MIA,
      grade: 2,
      kind: "passage",
      mode: "listen",
      takenAt: at(now, daysAgo),
      seconds: 60,
      items: readingItems(textId, correct, errors),
      textId,
      patterns,
    });

  const results: CheckResult[] = [
    // Weekly reading checks: 36 → 39 → 41 → 47 words per minute.
    reading("demo-mia-r1", 28, "g2-lemonade", 36, 4, ["firstLetterGuess"]),
    reading("demo-mia-r2", 21, "g2-big-move", 39, 3, ["firstLetterGuess"]),
    reading("demo-mia-r3", 14, "g2-science-fair", 41, 3, ["skipsSmallWords"]),
    reading("demo-mia-r4", 7, "g2-lemonade", 47, 2, []),
    buildResult({ id: "demo-mia-m1", childId: MIA, grade: 2, kind: "mathFacts", mode: "manual", takenAt: at(now, 20), seconds: 60, items: additionItems(14, 3) }),
    buildResult({ id: "demo-mia-m2", childId: MIA, grade: 2, kind: "mathFacts", mode: "manual", takenAt: at(now, 6), seconds: 60, items: additionItems(18, 2) }),
    buildResult({ id: "demo-leo-l1", childId: LEO, grade: "preK", kind: "letterNaming", mode: "manual", takenAt: at(now, 25, 17), seconds: 60, items: letterItems(3, 4) }),
    buildResult({ id: "demo-leo-l2", childId: LEO, grade: "preK", kind: "letterNaming", mode: "manual", takenAt: at(now, 8, 17), seconds: 60, items: letterItems(6, 3) }),
    buildResult({ id: "demo-leo-n1", childId: LEO, grade: "preK", kind: "numberNaming", mode: "manual", takenAt: at(now, 8, 17, 10), seconds: 60, items: numberItems(4, 2) }),
  ];

  const sessions: PracticeSession[] = [];
  const practice = (childId: string, daysAgo: number, minutes: number, stars: number, activity: PracticeSession["activities"][number]["activity"]) =>
    sessions.push({
      id: `demo-s-${childId}-${daysAgo}`,
      childId,
      date: dateKey(addDays(now, -daysAgo)),
      minutes,
      source: "app",
      activities: [{ activity, right: stars + 2, wrong: 2 }],
      stars,
    });
  // Mia: a 4-day streak up to today, and steady practice before that.
  for (const d of [0, 1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 19, 20, 22, 24, 26]) practice(MIA, d, 10, 4 + (d % 3), d % 2 ? "story" : "bigWord");
  for (const d of [0, 1, 3, 4, 7, 9, 11, 14]) practice(LEO, d, 5, 3, "hearLetter");
  sessions.push({
    id: "demo-s-mia-book",
    childId: MIA,
    date: dateKey(addDays(now, -2)),
    minutes: 20,
    source: "parent",
    activities: [],
    stars: 0,
  });

  const diary: DiaryEntry[] = [
    { id: "demo-d1", childId: MIA, at: at(now, 9, 20).toISOString(), text: "Mixing up b and d in her homework.", by: "parent" },
    { id: "demo-d2", childId: MIA, at: at(now, 2, 20).toISOString(), text: "We read a library book together for 20 minutes.", by: "parent" },
    { id: "demo-d3", childId: LEO, at: at(now, 5, 19).toISOString(), text: "Knows all the letters in his name now.", by: "parent" },
  ];

  const latestReading = results.find((r) => r.id === "demo-mia-r4")!;
  const latestLetters = results.find((r) => r.id === "demo-leo-l2")!;
  const plans = [
    makePlan(mia, latestReading, at(now, 7), "demo-plan-mia"),
    makePlan(leo, latestLetters, at(now, 8), "demo-plan-leo"),
  ];

  return {
    version: 1,
    demo: true,
    onboardedAt: created,
    children: [mia, leo],
    results,
    plans,
    sessions,
    diary,
    settings: { ...DEFAULT_SETTINGS, reminderTime: "19:00" },
    deviceId,
  };
}
