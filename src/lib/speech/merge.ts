// Decides each passage word from two speech models (see speech/app.py):
//   both heard it right      → correct
//   both heard a mistake     → misread / skipped
//   they disagree            → "check": the parent confirms on the review screen
// wav2vec2 catches the most mistakes but also flags some correct words; Whisper rarely flags a
// correct word but "fixes" real mistakes. Agreement is reliable; disagreement goes to a person.

import type { HeardWord, TranscribeResponse } from "@/lib/api/contract";
import { type Alignment, type AlignedWord, align, type SpokenWord } from "@/lib/reading/align";
import { type Assessment, assessAligned } from "@/lib/reading/assess";
import type { Grade } from "@/lib/reading/norms";
import { type PassageWord, tokenizeTranscript } from "@/lib/reading/text";

/** What the Modal service returns. Internal to the backend. */
export type ServiceWord = { word: string; start: number; end: number };
export type ServiceTranscript = { text: string; words: ServiceWord[] };
export type SpeechServiceResponse = {
  seconds: number;
  ms: number;
  wav2vec2: ServiceTranscript;
  whisper: ServiceTranscript;
};

export function toSpoken(t: ServiceTranscript): SpokenWord[] {
  return t.words.flatMap((w) => tokenizeTranscript(w.word).map((norm) => ({ norm, t: w.start })));
}

const isError = (w: AlignedWord) => w.status === "misread" || w.status === "skipped";

/** Combines the two alignments of the same reading. `a` is wav2vec2, `b` is Whisper. */
export function mergeAlignments(a: Alignment, b: Alignment): Omit<TranscribeResponse, "ms"> {
  const lastAttempted = Math.max(a.lastAttempted, b.lastAttempted);
  const words: HeardWord[] = a.words.map((wa, index) => {
    const wb = b.words[index];
    if (index > lastAttempted) return { index, status: "unreached" };
    const t = wa.t ?? wb.t;

    // Past one model's last word only the other one heard anything.
    const aKnows = index <= a.lastAttempted;
    const bKnows = index <= b.lastAttempted;
    if (!aKnows || !bKnows) {
      const only = aKnows ? wa : wb;
      if (!isError(only)) return { index, status: "correct", t };
      return { index, status: "check", heard: aKnows ? only.heard : undefined, heardSecond: bKnows ? only.heard : undefined, t };
    }

    if (!isError(wa) && !isError(wb)) return { index, status: "correct", t };
    if (isError(wa) && isError(wb)) {
      const misread = wa.status === "misread" ? wa : wb.status === "misread" ? wb : null;
      return misread ? { index, status: "misread", heard: misread.heard, t } : { index, status: "skipped" };
    }
    return { index, status: "check", heard: wa.heard, heardSecond: wb.heard, t };
  });

  return { words, lastAttempted, toReview: words.filter((w) => w.status === "check").map((w) => w.index) };
}

export function transcribeFromService(passage: PassageWord[], service: SpeechServiceResponse): TranscribeResponse {
  const a = align(passage, toSpoken(service.wav2vec2));
  const b = align(passage, toSpoken(service.whisper));
  return { ...mergeAlignments(a, b), ms: service.ms };
}

/**
 * After the review screen. `flipped` holds the words the parent tapped: a "check" word counts as
 * correct unless tapped (benefit of the doubt); any other word flips between right and wrong.
 */
export function heardToAlignment(heard: Pick<TranscribeResponse, "words" | "lastAttempted">, flipped: ReadonlySet<number>): Alignment {
  const words: AlignedWord[] = heard.words.map((w) => {
    if (w.index > heard.lastAttempted || w.status === "unreached") return { index: w.index, status: "unreached" };
    const wrongBefore = w.status === "misread" || w.status === "skipped";
    const wrong = w.status === "check" ? flipped.has(w.index) : flipped.has(w.index) ? !wrongBefore : wrongBefore;
    if (!wrong) return { index: w.index, status: "correct", t: w.t };
    if (w.status === "skipped") return { index: w.index, status: "skipped" };
    return { index: w.index, status: "misread", heard: w.heard ?? w.heardSecond, t: w.t };
  });
  return { words, inserted: [], lastAttempted: heard.lastAttempted };
}

/**
 * The finished reading as an Assessment, scored by the same rules as every other reading check,
 * so `readingView()` in src/lib/checks/result.ts turns it into the result screen.
 */
export function assessHeard(input: {
  passage: PassageWord[];
  heard: Pick<TranscribeResponse, "words" | "lastAttempted">;
  flipped: ReadonlySet<number>;
  seconds: number;
  grade: Grade;
  date: Date;
}): Assessment {
  const { passage, heard, flipped, seconds, grade, date } = input;
  return assessAligned({ passage, alignment: heardToAlignment(heard, flipped), seconds, grade, date });
}
