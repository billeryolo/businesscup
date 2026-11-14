// Word normalization shared by passages and speech transcripts, so "Don't," and "dont" match.

export type PassageWord = {
  /** The word as shown on screen, punctuation included. */
  display: string;
  /** Lowercase letters and digits only, used for matching. */
  norm: string;
  /**
   * A name or other proper noun. Speech recognizers often write names they don't know as other
   * words, so a name gets the benefit of the doubt when scoring.
   */
  name?: boolean;
};

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six",
  "7": "seven", "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve",
  "13": "thirteen", "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
  "18": "eighteen", "19": "nineteen", "20": "twenty", "30": "thirty", "40": "forty",
  "50": "fifty", "60": "sixty", "70": "seventy", "80": "eighty", "90": "ninety", "100": "hundred",
};

export function normalizeWord(raw: string): string {
  const word = raw
    .toLowerCase()
    .replace(/[‘’ʼ']/g, "")
    .replace(/[^a-z0-9]/g, "");
  return NUMBER_WORDS[word] ?? word;
}

export function tokenizePassage(text: string): PassageWord[] {
  return markNames(
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((display) => ({ display, norm: normalizeWord(display) }))
      .filter((w) => w.norm.length > 0),
  );
}

// Capitalized words that are ordinary words a recognizer knows, not names.
const NOT_NAMES = new Set([
  "i", "im", "ill", "ive", "id", "aunt", "uncle",
  "mom", "dad", "mommy", "daddy", "grandma", "grandpa", "granny", "mr", "mrs", "ms", "dr",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august", "september",
  "october", "november", "december",
]);
const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "st"]);
const OPENS_QUOTE = /^["“‘'(]/;
const ENDS_SENTENCE = /[.!?]["”’')]*$/;

const startsUpper = (display: string) => /^[^\p{L}\p{N}]*\p{Lu}/u.test(display);
/** "Maya's" and "Maya" are the same name. */
const nameKey = (display: string) => normalizeWord(display.replace(/['’]s?[^\p{L}\p{N}]*$/u, ""));

/**
 * Finds names: words capitalized in the middle of a sentence that never appear in lowercase in
 * the same text. Every capitalized use of such a word is then a name, sentence starts included.
 */
function markNames(words: PassageWord[]): PassageWord[] {
  const lowercase = new Set(words.filter((w) => !startsUpper(w.display)).map((w) => nameKey(w.display)));
  const names = new Set<string>();
  words.forEach((w, i) => {
    const key = nameKey(w.display);
    if (!startsUpper(w.display) || NOT_NAMES.has(key) || lowercase.has(key)) return;
    const prev = words[i - 1];
    const sentenceStart = !prev || OPENS_QUOTE.test(w.display) || (ENDS_SENTENCE.test(prev.display) && !ABBREVIATIONS.has(prev.norm));
    if (!sentenceStart) names.add(key);
  });
  return words.map((w) => (startsUpper(w.display) && names.has(nameKey(w.display)) ? { ...w, name: true } : w));
}

const FILLERS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "hmm", "mm", "ah"]);

/** Splits a speech transcript into normalized words; hyphens separate words, fillers are dropped. */
export function tokenizeTranscript(text: string): string[] {
  return text
    .split(/[\s\-–—]+/)
    .map(normalizeWord)
    .filter((w) => w && !FILLERS.has(w));
}

// Words a speech recognizer may legitimately write differently from the passage even though
// the child said them correctly.
const HOMOPHONE_GROUPS = [
  ["to", "too", "two"],
  ["there", "their", "theyre"],
  ["hear", "here"],
  ["see", "sea"],
  ["right", "write"],
  ["one", "won"],
  ["for", "four", "fore"],
  ["by", "buy", "bye"],
  ["no", "know"],
  ["new", "knew"],
  ["ate", "eight"],
  ["son", "sun"],
  ["blue", "blew"],
  ["wood", "would"],
  ["flour", "flower"],
  ["tail", "tale"],
  ["meet", "meat"],
  ["week", "weak"],
  ["road", "rode"],
  ["hole", "whole"],
  ["night", "knight"],
  ["red", "read"],
  ["threw", "through"],
  ["pair", "pear"],
  ["dear", "deer"],
  ["hour", "our"],
  ["ok", "okay"],
  ["grandpa", "grampa"],
  ["mom", "mum", "mam"],
  ["gray", "grey"],
  ["mr", "mister"],
  ["mrs", "missus", "misses"],
  ["dr", "doctor"],
];

const SOUND_KEY = new Map<string, number>();
HOMOPHONE_GROUPS.forEach((group, i) => group.forEach((w) => SOUND_KEY.set(w, i)));

/** True when a recognized word counts as the passage word. */
export function wordsMatch(passageNorm: string, spokenNorm: string): boolean {
  if (passageNorm === spokenNorm) return true;
  const a = SOUND_KEY.get(passageNorm);
  return a !== undefined && a === SOUND_KEY.get(spokenNorm);
}
