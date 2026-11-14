// Fake backend for the frontend developer (NEXT_PUBLIC_API_MOCK=1). It keeps state in memory for
// the browser tab, so adding a child or saving a check shows up on the dashboard until a reload.
// Every response is checked against contract.ts by the client, so mocks can't drift silently.
// Example family: Mia (grade 2, three weekly reading checks) and Leo (Pre-K, nothing yet).

import { PASSAGES, PRACTICE_PASSAGES } from "@/lib/reading/passages";
import { tokenizePassage } from "@/lib/reading/text";
import type { CallArgs } from "./client";
import { ApiRequestError } from "./client";
import type { Archetype, CheckResult, Child, Domain, EndpointName, Grade, MathFamily, ParentSummary, Progress, Res } from "./contract";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
const uuid = () => crypto.randomUUID();

function archetypeFor(grade: Grade): { archetype: Archetype; domains: Domain[]; sessionMinutes: number } {
  if (grade < 0) return { archetype: "explorer", domains: ["letters", "numbers"], sessionMinutes: 5 };
  if (grade <= 1) return { archetype: "builder", domains: ["letters", "reading", "math"], sessionMinutes: 10 };
  return { archetype: "fluent", domains: ["reading", "math"], sessionMinutes: 15 };
}

const makeChild = (firstName: string, grade: Grade, extra: Partial<Child> = {}): Child => ({
  id: uuid(), firstName, grade, ...archetypeFor(grade), stars: 0, streakDays: 0, createdAt: daysAgo(21), ...extra,
});

const SUMMARY: ParentSummary = {
  headline: "Mia is reading a little below the typical pace for 2nd grade in the fall.",
  meaning: "Mia read 41 words correctly in one minute, with 93% of words right. The typical (middle) score for 2nd grade in the fall is 50. Children 10 or more words below the middle usually catch up with a few minutes of focused practice each day.",
  focus: [{ title: "Guesses from the first letter", why: "\"stand\" was read as \"stop\" and \"squeezed\" as \"said\".", tonight: "Cover the word and reveal it left to right, saying each sound." }],
  plan: [1, 2, 3, 4].map((week) => ({ week, goal: ["Slow down and look at every letter", "Blend two-letter starts (st, sq)", "Read the same story three times", "One-minute re-check"][week - 1], daily: "10 minutes: re-read one page, then 5 tricky words on cards." })),
  teacherNote: "Mia read 41 words correct per minute at 93% accuracy on a grade 2 passage (fall median 50). We are practising blending at home for 10 minutes a day.",
  source: "rules",
};

const state = (() => {
  const mia = makeChild("Mia", 2, { stars: 46, streakDays: 4 });
  const leo = makeChild("Leo", -1);
  const checks: CheckResult[] = [41, 47, 55].map((value, i) => readingResult(mia.id, value, daysAgo(14 - i * 7), i === 2 ? SUMMARY : null));
  return { user: { id: uuid(), email: "parent@example.com" }, consentVersion: "2026-11" as string | null, trialPlan: null as "yearly" | "monthly" | null, children: [mia, leo], checks };
})();

function readingResult(childId: string | null, value: number, takenAt: string, summary: ParentSummary | null): CheckResult {
  const passage = PASSAGES.find((p) => p.grade === 2)!;
  const words = tokenizePassage(passage.text).slice(0, value + 3);
  return {
    id: childId ? uuid() : null, childId, domain: "reading", takenAt, mode: "live", grade: 2, seconds: 60,
    measure: "wcpm", value, accuracy: value / (value + 3), benchmark: { median: 50, p25: 36, season: "fall", source: "Hasbrouck & Tindal 2017" },
    band: value < 50 ? "25th–50th" : "50th–75th", verdict: value <= 40 ? "practice" : "onTrack",
    patterns: [{ id: "firstLetterGuess", title: "Guesses from the first letter", seen: "Some words were replaced by other words that start with the same letter.", tip: "Cover the word and reveal it left to right, saying each sound.", examples: [{ word: "stand", heard: "stop" }] }],
    details: { kind: "reading", passageId: passage.id, passageTitle: passage.title, words: words.map((w, i) => ({ text: w.display, status: i % 17 === 5 ? "misread" : "correct", ...(i % 17 === 5 ? { heard: "the" } : {}) })) },
    claimToken: childId ? null : "mock-claim-token", summary,
  };
}

const FACT: Record<MathFamily, (i: number) => [string, string, number]> = {
  add5: (i) => { const a = i % 3, b = (i * 2) % 3; return [`add:${a}+${b}`, `${a} + ${b}`, a + b]; },
  add10: (i) => { const a = (i * 3) % 6, b = (i * 7) % 5; return [`add:${a}+${b}`, `${a} + ${b}`, a + b]; },
  sub10: (i) => { const a = 5 + (i % 6), b = i % 5; return [`sub:${a}-${b}`, `${a} − ${b}`, a - b]; },
  add20: (i) => { const a = 6 + (i % 4), b = 5 + ((i * 3) % 5); return [`add:${a}+${b}`, `${a} + ${b}`, a + b]; },
  sub20: (i) => { const a = 11 + (i % 8), b = 3 + (i % 7); return [`sub:${a}-${b}`, `${a} − ${b}`, a - b]; },
  mul: (i) => { const a = 2 + (i % 8), b = 3 + ((i * 5) % 7); return [`mul:${a}x${b}`, `${a} × ${b}`, a * b]; },
  div: (i) => { const b = 2 + (i % 8), q = 3 + ((i * 5) % 7); return [`div:${b * q}/${b}`, `${b * q} ÷ ${b}`, q]; },
};

function progressFor(child: Child): Progress {
  return {
    child,
    domains: child.domains.map((domain) => {
      const mine = state.checks.filter((c) => c.childId === child.id && c.domain === domain && c.id);
      const last = mine.at(-1);
      return {
        domain,
        status: last ? last.verdict : "notStarted",
        measure: last?.measure ?? null,
        points: mine.map((c) => ({ takenAt: c.takenAt, value: c.value })),
        benchmark: last?.benchmark ?? null,
        weeklyGrowth: domain === "reading" && child.grade >= 1 ? 1.6 : null,
        lastCheckId: last?.id ?? null,
        nextCheckDue: last ? new Date(Date.parse(last.takenAt) + 7 * 86_400_000).toISOString() : null,
      };
    }),
  };
}

const find = (childId: string | undefined) => {
  const child = state.children.find((c) => c.id === childId);
  if (!child) throw new ApiRequestError(404, "NOT_FOUND", "No such child");
  return child;
};

type Any = Record<string, never>;

export async function mockHandler<N extends EndpointName>(name: N, args: CallArgs<N>): Promise<Res<N>> {
  const body = (args.body ?? {}) as Any & Record<string, unknown>;
  const query = (args.query ?? {}) as Record<string, unknown>;
  const p = args.params ?? {};
  const out = (x: unknown) => x as Res<N>;

  switch (name) {
    case "sendMagicLink":
    case "giveConsent":
    case "trialInterest":
      return out(null);
    case "deleteAccount":
      state.children = [];
      state.checks = [];
      return out(null);
    case "me":
      return out({ user: state.user, consentVersion: state.consentVersion, trialPlan: state.trialPlan, children: state.children });
    case "listChildren":
      return out(state.children);
    case "addChild": {
      if (state.children.length >= 3) throw new ApiRequestError(409, "CHILD_LIMIT", "An account can track up to 3 children.");
      const child = makeChild(String(body.firstName), Number(body.grade) as Grade, { createdAt: new Date().toISOString() });
      state.children.push(child);
      return out(child);
    }
    case "updateChild": {
      const child = find(p.childId);
      Object.assign(child, body, body.grade !== undefined ? archetypeFor(Number(body.grade) as Grade) : {});
      return out(child);
    }
    case "deleteChild":
      state.children = state.children.filter((c) => c.id !== p.childId);
      return out(null);
    case "progress":
      return out(progressFor(find(p.childId)));
    case "todaySession": {
      const child = find(p.childId);
      const plan = {
        explorer: [["letterTap", "letters", "letters.sounds.b-d", "Letter sounds: b and d", 3], ["countObjects", "numbers", "numbers.count.10", "Counting to 10", 2]],
        builder: [["letterTap", "letters", "letters.sounds.short-vowels", "Short vowel sounds", 3], ["bigWord", "reading", "reading.sight.set2", "Sight words, set 2", 4], ["mathFacts", "math", "math.add10", "Adding within 10", 3]],
        fluent: [["story", "reading", "reading.phonics.st-blend", "A story with st- words", 7], ["mathFacts", "math", "math.add20", "Adding within 20", 5], ["readAloud", "reading", "reading.fluency", "Read it again, faster", 3]],
      }[child.archetype] as [string, Domain, string, string, number][];
      return out({
        childId: child.id, minutes: child.sessionMinutes,
        activities: plan.map(([kind, domain, skillId, label, minutes]) => ({ kind, domain, skillId, label, minutes, params: kind === "mathFacts" ? { family: skillId.split(".")[1], purpose: "practice" } : {} })),
        dueCheck: child.archetype === "fluent" ? { domain: "reading", kind: "readingCheck" } : null,
      });
    }
    case "logAttempts": {
      const child = find(p.childId);
      const attempts = (body.attempts as unknown as { correct: boolean }[]) ?? [];
      const earned = attempts.filter((a) => a.correct).length;
      child.stars += earned;
      return out({ stars: child.stars, streakDays: child.streakDays || 1, starsEarned: earned });
    }
    case "passage": {
      const grade = Math.max(1, Number(query.grade)) as 1 | 2 | 3 | 4;
      const pool = query.purpose === "practice" ? PRACTICE_PASSAGES : PASSAGES;
      const passage = pool.find((x) => x.grade === grade) ?? PASSAGES[0];
      return out({ id: passage.id, title: passage.title, grade: passage.grade, purpose: query.purpose, words: tokenizePassage(passage.text).map((w) => ({ display: w.display, ...(w.name ? { name: true } : {}) })) });
    }
    case "letters":
      return out("abcdefghijklmnopqrstuvwxyz".split("").map((l) => ({ letter: l, upper: l.toUpperCase(), sound: `/${l}/`, example: { a: "apple", b: "ball", c: "cat", d: "dog" }[l as "a"] ?? `${l}…` })));
    case "mathFacts": {
      const family = query.family as MathFamily;
      return out(Array.from({ length: Number(query.count ?? 20) }, (_, i) => {
        const [id, prompt, answer] = FACT[family](i);
        return query.purpose === "practice" ? { id, prompt, answer } : { id, prompt };
      }));
    }
    case "generateStory":
      return out({
        title: `Stan and the ${String(body.interest)}`,
        words: tokenizePassage(`Stan had a stack of sticks. A big ${String(body.interest)} stood still on the step. Stan said, "Stop! Stay!" It did not stop. It ran past the stump.`).map((w) => ({ display: w.display })),
        questions: [{ q: "What did Stan have?", choices: ["A stack of sticks", "A red hat", "A dog"], answer: 0 }],
        rejectedWords: ["stomped", "stegosaurus"],
        source: "ai",
      });
    case "previewReading":
    case "submitReading": {
      const value = Math.max(0, ((body.spoken as unknown as unknown[]) ?? []).length || 52);
      const result = readingResult(name === "submitReading" ? ((body.childId as string | null) ?? null) : null, value, new Date().toISOString(), null);
      if (name === "submitReading" && result.childId) state.checks.push(result);
      return out(result);
    }
    case "submitMath":
    case "submitLetters": {
      const isMath = name === "submitMath";
      const items = (isMath ? body.answers : body.items) as unknown as { factId?: string; given?: number | null; responseMs?: number; letter?: string; correct?: boolean }[];
      const correct = items.filter((x) => (isMath ? x.given !== null : x.correct)).length;
      const result: CheckResult = {
        id: body.childId ? uuid() : null, childId: (body.childId as string | null) ?? null, domain: isMath ? "math" : "letters",
        takenAt: new Date().toISOString(), mode: "manual", grade: Number(body.grade ?? -1) as Grade, seconds: Number(body.seconds),
        measure: isMath ? "factsPerMinute" : "lettersPerMinute", value: Math.round((correct * 60) / Number(body.seconds)), accuracy: items.length ? correct / items.length : 0,
        benchmark: null, band: null, verdict: "onTrack", patterns: [],
        details: isMath
          ? { kind: "math", family: body.family as MathFamily, items: items.map((x) => ({ factId: x.factId!, prompt: x.factId!.split(":")[1] ?? "", answer: 0, given: x.given ?? null, correct: x.given !== null, responseMs: x.responseMs ?? 0 })) }
          : { kind: "letters", items: items.map((x) => ({ letter: x.letter!, correct: Boolean(x.correct) })) },
        claimToken: body.childId ? null : "mock-claim-token", summary: null,
      };
      if (result.childId) state.checks.push(result);
      return out(result);
    }
    case "claimCheck": {
      const child = state.children.find((c) => c.id === (body.childId as string | null)) ?? state.children[0];
      if (!child) throw new ApiRequestError(404, "NOT_FOUND", "Add a child first");
      const result = { ...readingResult(child.id, 52, new Date().toISOString(), null) };
      state.checks.push(result);
      return out(result);
    }
    case "listChecks":
      return out(state.checks.filter((c) => c.childId === query.childId && (!query.domain || c.domain === query.domain)));
    case "getCheck": {
      const check = state.checks.find((c) => c.id === p.checkId);
      if (!check) throw new ApiRequestError(404, "NOT_FOUND", "No such check");
      return out(check);
    }
    case "deleteCheck":
      state.checks = state.checks.filter((c) => c.id !== p.checkId);
      return out(null);
    case "summary":
      return out(SUMMARY);
  }
  throw new ApiRequestError(500, "INTERNAL", `No mock for "${name}"`);
}
