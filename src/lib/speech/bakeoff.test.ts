// Speech scoring bake-off. Skipped in the normal test run; two phases, run by hand:
//
//   BAKEOFF=make  npx vitest run src/lib/speech/bakeoff.test.ts   → speech/bakeoff/readings.json
//     Scripts with planted mistakes (misreads, dropped endings, skipped words, a skipped line),
//     plus repeats and an "um" that must NOT count, and the answer key per passage word.
//   (speech/bakeoff/run.ps1 voices each script and sends it to the speech service.)
//   BAKEOFF=score npx vitest run src/lib/speech/bakeoff.test.ts   → speech/bakeoff/results.md
//     Scores wav2vec2 alone, Whisper alone, and the combined method against the key.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { align } from "@/lib/reading/align";
import { passageById, passageWords } from "@/lib/reading/passages";
import type { PassageWord } from "@/lib/reading/text";
import { mergeAlignments, type SpeechServiceResponse, toSpoken } from "./merge";

const DIR = join(process.cwd(), "speech", "bakeoff");
const MODE = process.env.BAKEOFF;

type Reading = {
  id: string;
  textId: string;
  voice: string;
  script: string;
  /** Last passage word read. */
  lastWord: number;
  /** Passage word indices that are real mistakes (misread or skipped). */
  errors: number[];
  planted: string[];
};

// A deterministic random, so the set can be rebuilt exactly.
function rng(seed: number) {
  let a = seed * 2654435761 % 4294967296;
  const next = () => ((a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = 0; i < 8; i++) next(); // nearby seeds start out alike; skip ahead
  return next;
}

const GUESS: Record<string, string> = { b: "bed", c: "cup", d: "dog", f: "fun", g: "got", h: "hot", l: "lot", m: "man", p: "pot", r: "red", s: "sat", t: "ten", w: "wet" };

function misread(word: string, r: () => number): string | null {
  const w = word.toLowerCase();
  for (const end of ["ing", "ed", "es", "s"]) if (w.length > end.length + 2 && w.endsWith(end)) return w.slice(0, -end.length);
  if (w.length >= 4 && GUESS[w[0]] && GUESS[w[0]] !== w) return r() < 0.5 ? GUESS[w[0]] : `${w.slice(0, 2)}${w.slice(3)}`;
  return null;
}

function makeReading(id: string, textId: string, voice: string, seed: number, length: number): Reading {
  const words: PassageWord[] = passageWords(passageById(textId)!);
  const r = rng(seed);
  const lastWord = Math.min(words.length - 1, length - 1);
  const say: string[] = [];
  const errors: number[] = [];
  const planted: string[] = [];
  const pick = (from: number, to: number) => from + Math.floor(r() * (to - from));
  // Plan: 3 misreads, 2 skipped small words, one skipped run of 6, one repeat, one "um".
  const skipRunAt = pick(25, lastWord - 15);
  const misreadAt = new Set<number>();
  while (misreadAt.size < 3) {
    const i = pick(3, lastWord - 2);
    if (Math.abs(i - skipRunAt) > 8 && misread(words[i].norm, r) && !words[i].name) misreadAt.add(i);
  }
  const skipAt = new Set<number>();
  while (skipAt.size < 2) {
    const i = pick(3, lastWord - 2);
    if (!misreadAt.has(i) && Math.abs(i - skipRunAt) > 8 && words[i].norm.length <= 3) skipAt.add(i);
  }
  const repeatAt = pick(5, lastWord - 5);
  const umAt = pick(5, lastWord - 5);

  for (let i = 0; i <= lastWord; i++) {
    const w = words[i];
    if (i >= skipRunAt && i < skipRunAt + 6) {
      errors.push(i);
      if (i === skipRunAt) planted.push(`skipped line: "${words.slice(i, i + 6).map((x) => x.display).join(" ")}"`);
      continue;
    }
    if (skipAt.has(i)) {
      errors.push(i);
      planted.push(`skipped "${w.display}"`);
      continue;
    }
    if (i === umAt) say.push("um,");
    if (misreadAt.has(i)) {
      const heard = misread(w.norm, r)!;
      say.push(heard + (/[.,!?]$/.test(w.display) ? w.display.slice(-1) : ""));
      errors.push(i);
      planted.push(`"${w.display}" read as "${heard}"`);
      continue;
    }
    say.push(w.display);
    if (i === repeatAt) say.push(w.display.replace(/[.,!?"]/g, ""));
  }
  return { id, textId, voice, script: say.join(" ").replace(/"/g, ""), lastWord, errors: errors.sort((a, b) => a - b), planted };
}

type Score = { tp: number; fp: number; fn: number; wcpmErr: number };

function score(predictedErrors: Set<number>, lastAttempted: number, reading: Reading): Score {
  const truth = new Set(reading.errors);
  let tp = 0;
  let fp = 0;
  for (const i of predictedErrors) (truth.has(i) ? tp++ : fp++);
  const fn = [...truth].filter((i) => !predictedErrors.has(i)).length;
  // Correct words read: the truth vs what the method would count (same 60 s base, so this is WCPM error).
  const trueCorrect = reading.lastWord + 1 - truth.size;
  const predCorrect = lastAttempted + 1 - predictedErrors.size;
  return { tp, fp, fn, wcpmErr: predCorrect - trueCorrect };
}

const isErr = (s: string) => s === "misread" || s === "skipped";

describe.skipIf(!MODE)("speech bake-off", () => {
  it.runIf(MODE === "make")("makes the readings", () => {
    const readings = [
      makeReading("g2-zira", "g2-lemonade", "sapi:Zira:-1", 11, 80),
      makeReading("g2-david", "g2-lemonade", "sapi:David:0", 22, 80),
      makeReading("g2-kokoro", "g2-lemonade", "kokoro", 33, 80),
      makeReading("g3-zira", "g3-night-garden", "sapi:Zira:0", 44, 90),
      makeReading("g3-david", "g3-night-garden", "sapi:David:-2", 55, 90),
      makeReading("g3-kokoro", "g3-night-garden", "kokoro", 66, 90),
    ];
    writeFileSync(join(DIR, "readings.json"), JSON.stringify(readings, null, 2));
  });

  it.runIf(MODE === "score")("scores the methods", () => {
    const readings = JSON.parse(readFileSync(join(DIR, "readings.json"), "utf8")) as Reading[];
    const methods = ["wav2vec2 alone", "Whisper alone", "Combined, parent skips review", "Combined, parent confirms flagged words"] as const;
    const totals = Object.fromEntries(methods.map((m) => [m, { tp: 0, fp: 0, fn: 0, wcpmAbs: 0 }]));
    const rows: string[] = [];
    let checks = 0;
    for (const reading of readings) {
      const file = join(DIR, "out", `${reading.id}.json`);
      if (!existsSync(file)) continue;
      const svc = JSON.parse(readFileSync(file, "utf8")) as SpeechServiceResponse;
      const passage = passageWords(passageById(reading.textId)!);
      const a = align(passage, toSpoken(svc.wav2vec2));
      const b = align(passage, toSpoken(svc.whisper));
      const merged = mergeAlignments(a, b);
      const errSet = (words: { index: number; status: string }[], last: number, extra = (s: string) => isErr(s)) =>
        new Set(words.filter((w) => w.index <= last && extra(w.status)).map((w) => w.index));
      // The parent confirms flagged words correctly: a flagged word becomes an error only if it truly is one.
      const truth = new Set(reading.errors);
      const confirmed = new Set([...errSet(merged.words, merged.lastAttempted), ...merged.toReview.filter((i) => truth.has(i))]);
      checks += merged.toReview.length;
      const per = {
        "wav2vec2 alone": score(errSet(a.words, a.lastAttempted), a.lastAttempted, reading),
        "Whisper alone": score(errSet(b.words, b.lastAttempted), b.lastAttempted, reading),
        "Combined, parent skips review": score(errSet(merged.words, merged.lastAttempted), merged.lastAttempted, reading),
        "Combined, parent confirms flagged words": score(confirmed, merged.lastAttempted, reading),
      };
      for (const m of methods) {
        const t = totals[m];
        t.tp += per[m].tp;
        t.fp += per[m].fp;
        t.fn += per[m].fn;
        t.wcpmAbs += Math.abs(per[m].wcpmErr);
      }
      rows.push(
        `| ${reading.id} | ${reading.errors.length} | ${methods.map((m) => `${per[m].tp}/${per[m].fp}/${per[m].fn} (${per[m].wcpmErr >= 0 ? "+" : ""}${per[m].wcpmErr})`).join(" | ")} | ${merged.toReview.length} |`,
      );
    }
    const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "–");
    const summary = methods.map((m) => {
      const t = totals[m];
      return `| ${m} | ${pct(t.tp, t.tp + t.fn)} | ${pct(t.tp, t.tp + t.fp)} | ${t.fp} | ${(t.wcpmAbs / rows.length).toFixed(1)} |`;
    });
    const md = [
      "# Speech scoring bake-off",
      "",
      `${rows.length} synthetic readings (two Windows voices and Kokoro) of a grade 2 and a grade 3 story, each with planted mistakes: 3 misreads (dropped endings, first-letter guesses), 2 skipped small words and a skipped line of 6 words, plus a repeated word and an "um" that must not count. Answer key from the app's own word splitting.`,
      "",
      "| Method | Mistakes caught (recall) | Flags that were real (precision) | False alarms | Avg. words-a-minute error |",
      "|---|---|---|---|---|",
      ...summary,
      "",
      `The combined method asked the parent to check ${checks} word(s) across all readings.`,
      "",
      "Per reading: caught / false alarms / missed (words-a-minute error), and words to check.",
      "",
      `| Reading | Planted | ${methods.join(" | ")} | To check |`,
      `|---|---|${methods.map(() => "---").join("|")}|---|`,
      ...rows,
      "",
      "Caveat: synthetic adult voices are far clearer than children, so all numbers are optimistic. Re-run with real child recordings before trusting them.",
    ].join("\n");
    writeFileSync(join(DIR, "results.md"), md + "\n");
    console.log(md);
  });
});
