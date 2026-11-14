import { describe, expect, it } from "vitest";
import { align, type SpokenWord } from "./align";
import { assess } from "./assess";
import { expectedWeeklyGrowth, needsFluencyBuilding, normsFor, percentileBand, seasonFor } from "./norms";
import { PASSAGES, PRACTICE_PASSAGES, passageById, passageFor, passageWords, pickPassage } from "./passages";
import { countSyllables, fleschKincaidGrade } from "./readability";
import { applyParentMarks, scoreReading } from "./score";
import { DEMO_PROFILES, simulateReading } from "./simulate";
import { rulesSummary, summaryFacts } from "./summary";
import { hasSyllables, syllabify } from "./syllables";
import { normalizeWord, tokenizePassage, tokenizeTranscript } from "./text";

const said = (text: string): SpokenWord[] => tokenizeTranscript(text).map((norm) => ({ norm }));

describe("text", () => {
  it("normalizes punctuation, apostrophes and numbers", () => {
    expect(normalizeWord('"Hat!"')).toBe("hat");
    expect(normalizeWord("Don’t")).toBe("dont");
    expect(normalizeWord("2")).toBe("two");
    expect(tokenizeTranscript("um the sun-hat uh is red")).toEqual(["the", "sun", "hat", "is", "red"]);
  });
});

describe("align", () => {
  const passage = tokenizePassage("The cat sat on the big red mat. It was happy.");

  it("marks a perfect reading correct and the rest unreached", () => {
    const a = align(passage, said("the cat sat on the big"));
    expect(a.words.slice(0, 6).every((w) => w.status === "correct")).toBe(true);
    expect(a.words.slice(6).every((w) => w.status === "unreached")).toBe(true);
    expect(a.lastAttempted).toBe(5);
  });

  it("finds misread, skipped and extra words", () => {
    const a = align(passage, said("the cat cat sat the bag red mat"));
    expect(a.words[3].status).toBe("skipped"); // on
    expect(a.words[5]).toMatchObject({ status: "misread", heard: "bag" }); // big
    expect(a.words[6].status).toBe("correct");
    expect(a.inserted.map((w) => w.norm)).toEqual(["cat"]);
  });

  it("accepts homophones and joined or split words", () => {
    const p = tokenizePassage("I saw two sunflowers by the sea.");
    const a = align(p, said("I saw too sun flowers buy the see"));
    expect(a.words.every((w) => w.status === "correct")).toBe(true);
  });

  it("finds names: capitalized mid-sentence, possessives too, not sentence starts or family words", () => {
    const p = tokenizePassage('Maya and her dog Pip ran. "Come, Pip!" said Mom to Maya. Maya\'s hat fell. I ran on Monday.');
    const names = p.filter((w) => w.name).map((w) => w.display);
    expect(names).toEqual(["Maya", "Pip", "Pip!\"", "Maya.", "Maya's"]);
  });

  it("gives names leeway: misheard, split or dropped still count as read", () => {
    const p = tokenizePassage("Then Priya and Kai went home with Nora.");
    const a = align(p, said("then pria and k i went home with"));
    expect(a.words[1]).toMatchObject({ status: "correct", lenient: true, heard: "pria" });
    expect(a.words[3]).toMatchObject({ status: "correct", lenient: true, heard: "k i" });
    // Nora was never reached, so it isn't credited.
    expect(a.lastAttempted).toBe(6);
    expect(a.words[7].status).toBe("unreached");

    const dropped = align(p, said("then and kai went home"));
    expect(dropped.words[1]).toMatchObject({ status: "correct", lenient: true });
    expect(dropped.words[3]).toMatchObject({ status: "correct" });
    expect(dropped.words[3].lenient).toBeUndefined();
  });

  it("doesn't let a name hide the mistakes around it", () => {
    const p = tokenizePassage("Then Priya ran to the big tree.");
    const a = align(p, said("then priya run to the bag tree"));
    expect(a.words[2]).toMatchObject({ status: "misread", heard: "run" });
    expect(a.words[5]).toMatchObject({ status: "misread", heard: "bag" });
    const marked = applyParentMarks(align(p, said("then pria ran")).words, 2, new Set([1]));
    expect(marked[1]).toEqual({ index: 1, status: "misread", t: undefined });
  });

  it("counts a misread last word as misread", () => {
    const a = align(passage, said("the cat sat on the bag"));
    expect(a.words[5]).toMatchObject({ status: "misread", heard: "bag" });
    expect(a.lastAttempted).toBe(5);
  });
});

describe("score", () => {
  const passage = tokenizePassage("one two three four five six seven eight nine ten");

  it("computes words correct per minute and accuracy", () => {
    const a = align(passage, said("one two tree four five six"));
    const s = scoreReading(a.words, a.lastAttempted, 30);
    expect(s).toMatchObject({ attempted: 6, correct: 5, errors: 1, wcpm: 10 });
    expect(s.accuracy).toBeCloseTo(5 / 6);
  });

  it("lets a parent flip words, but only attempted ones", () => {
    const a = align(passage, said("one two tree four"));
    const marked = applyParentMarks(a.words, a.lastAttempted, new Set([0, 2, 8]));
    expect(marked[0].status).toBe("misread");
    expect(marked[2].status).toBe("correct");
    expect(marked[8].status).toBe("unreached");
  });
});

describe("norms", () => {
  it("matches the published 2017 table at known anchor points", () => {
    expect(normsFor(4, "fall").values[50]).toBe(94);
    expect(normsFor(2, "spring").values[90]).toBe(148);
    expect(normsFor(3, "winter").values[10]).toBe(62);
  });

  it("uses the winter target for grade 1 in the fall", () => {
    const n = normsFor(1, "fall");
    expect(n).toMatchObject({ season: "winter", usedLaterSeason: true });
    expect(n.values[50]).toBe(29);
  });

  it("maps dates to school seasons", () => {
    expect(seasonFor(new Date(2026, 9, 25))).toBe("fall");
    expect(seasonFor(new Date(2027, 0, 15))).toBe("winter");
    expect(seasonFor(new Date(2027, 3, 1))).toBe("spring");
  });

  it("applies the 10-words-below-median rule and percentile bands", () => {
    const v = normsFor(2, "fall").values; // 50th = 50
    expect(needsFluencyBuilding(40, v)).toBe(true);
    expect(needsFluencyBuilding(41, v)).toBe(false);
    expect(percentileBand(20, v)).toBe("below 10th");
    expect(percentileBand(50, v)).toBe("50th–75th");
    expect(percentileBand(111, v)).toBe("above 90th");
  });

  it("has every percentile column increasing", () => {
    for (const grade of [1, 2, 3, 4] as const) {
      for (const season of ["fall", "winter", "spring"] as const) {
        const v = normsFor(grade, season).values;
        expect([v[10], v[25], v[50], v[75], v[90]]).toEqual([v[10], v[25], v[50], v[75], v[90]].sort((a, b) => a - b));
      }
    }
    expect(expectedWeeklyGrowth(2)).toBeCloseTo(50 / 32);
  });
});

describe("passages", () => {
  it("are long enough that a 90th-percentile spring reader is still reading at one minute", () => {
    for (const p of PASSAGES) {
      expect(passageWords(p).length).toBeGreaterThan(normsFor(p.grade, "spring").values[90]);
    }
  });

  it("read near their grade level, and get harder with each grade", () => {
    const average = [1, 2, 3, 4].map((grade) => {
      const levels = PASSAGES.filter((p) => p.grade === grade).map((p) => fleschKincaidGrade(p.text));
      expect(levels).toHaveLength(3);
      for (const level of levels) {
        // Flesch–Kincaid runs low on very simple text, so the lower bound is loose.
        expect(level).toBeGreaterThan(grade - 2.5);
        expect(level).toBeLessThan(grade + 1);
      }
      return levels.reduce((a, b) => a + b) / levels.length;
    });
    for (let i = 1; i < average.length; i++) expect(average[i]).toBeGreaterThan(average[i - 1]);
  });

  it("have unique ids and no abbreviations a recognizer would spell out", () => {
    expect(new Set(PASSAGES.map((p) => p.id)).size).toBe(PASSAGES.length);
    for (const p of PASSAGES) expect(p.text).not.toMatch(/\b(Mr|Mrs|Ms|Dr|St)\.|\d/);
  });

  it("picks an unread passage first, then the one read longest ago", () => {
    expect(pickPassage(2, []).id).toBe("g2-lemonade");
    expect(pickPassage(2, ["g2-lemonade"]).id).toBe("g2-big-move");
    expect(pickPassage(2, ["g2-big-move", "g2-lemonade"]).id).toBe("g2-science-fair");
    // Most recent first: lemonade was read longest ago.
    expect(pickPassage(2, ["g2-science-fair", "g2-big-move", "g2-lemonade"]).id).toBe("g2-lemonade");
    expect(pickPassage(2, ["g2-lemonade", "g2-science-fair", "g2-big-move", "g2-lemonade"]).id).toBe("g2-big-move");
  });
});

describe("practice stories", () => {
  it("are separate from the check stories and read near their grade level", () => {
    const checkIds = new Set(PASSAGES.map((p) => p.id));
    for (const p of PRACTICE_PASSAGES) {
      expect(checkIds.has(p.id)).toBe(false);
      expect(passageById(p.id)).toBe(p);
      expect(fleschKincaidGrade(p.text)).toBeLessThan(p.grade + 1.1);
    }
    for (const grade of [1, 2, 3, 4] as const) {
      expect(PRACTICE_PASSAGES.some((p) => p.grade === grade)).toBe(true);
      // Practicing never touches the stories a check uses.
      expect(pickPassage(grade, []).id.startsWith("p")).toBe(false);
    }
  });
});

describe("syllables", () => {
  // The rough syllable counter used for readability overcounts these one-syllable words.
  const ONE_SYLLABLE = new Set("called eyes hole miles pile played pulled queen reeled rolled rules smiled spelled squeezed tongue while whole".split(" "));

  it("splits words, keeping capitals, apostrophes and punctuation", () => {
    expect(syllabify('"Maya\'s,')).toEqual(['"Ma', "ya's,"]);
    expect(syllabify("Sunflowers.")).toEqual(["Sun", "flow", "ers."]);
    expect(syllabify("great-grandchildren")).toEqual(["great-", "grand", "chil", "dren"]);
    expect(syllabify("every")).toEqual(["ev", "er", "y"]);
    expect(syllabify("Splash!")).toEqual(["Splash!"]);
  });

  it("covers every multi-syllable word in the stories", () => {
    const missing = new Set<string>();
    for (const p of [...PASSAGES, ...PRACTICE_PASSAGES]) {
      for (const piece of `${p.title} ${p.text}`.split(/[\s\-–]+/)) {
        const word = piece.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").replace(/['’](s|t|ll|re|ve|m|d)$/i, "").toLowerCase();
        if (word && countSyllables(word) >= 2 && !hasSyllables(word) && !ONE_SYLLABLE.has(word)) missing.add(word);
      }
    }
    expect([...missing]).toEqual([]);
  });
});

describe("assess", () => {
  const date = new Date(2026, 9, 25); // fall

  it("puts a typical 2nd grader on track", () => {
    const passage = passageWords(passageFor(2));
    const spoken = simulateReading(passage, { ...DEMO_PROFILES.onTrack, wordsPerMinute: 70 });
    const r = assess({ passage, spoken, seconds: 60, grade: 2, date });
    expect(r.score.wcpm).toBeGreaterThan(55);
    expect(r.verdict).toBe("onTrack");
  });

  it("flags a slow reader who guesses from the first letter", () => {
    const passage = passageWords(passageFor(3));
    const spoken = simulateReading(passage, DEMO_PROFILES.guesser);
    const r = assess({ passage, spoken, seconds: 60, grade: 3, date });
    expect(r.verdict).toBe("talkToTeacher");
    expect(r.needsFluencyBuilding).toBe(true);
    const ids = r.patterns.map((p) => p.id);
    expect(ids).toContain("firstLetterGuess");
    expect(ids).toContain("longPauses");
  });

  it("finds an accurate but slow reader", () => {
    const passage = passageWords(passageFor(4));
    const spoken = simulateReading(passage, { wordsPerMinute: 70, guessRate: 0, skipSmallRate: 0, pauseRate: 0, seed: 3 });
    const r = assess({ passage, spoken, seconds: 60, grade: 4, date });
    expect(r.score.accuracy).toBe(1);
    expect(r.patterns.map((p) => p.id)).toEqual(["accurateButSlow"]);
    expect(r.verdict).toBe("talkToTeacher"); // 70 is below the 25th percentile (75) for grade 4 fall
  });

  it("notices a skipped line", () => {
    const passage = passageWords(passageFor(2));
    const words = passage.map((w) => w.norm);
    const spoken = said([...words.slice(0, 20), ...words.slice(30, 60)].join(" "));
    const r = assess({ passage, spoken, seconds: 60, grade: 2, date });
    expect(r.patterns.map((p) => p.id)).toContain("losesPlace");
  });

  it("never gives the strongest verdict for speed alone in grade 1 fall", () => {
    const passage = passageWords(passageFor(1));
    const spoken = simulateReading(passage, { wordsPerMinute: 14, guessRate: 0, skipSmallRate: 0, pauseRate: 0, seed: 1 });
    const r = assess({ passage, spoken, seconds: 60, grade: 1, date });
    expect(r.norms.usedLaterSeason).toBe(true);
    expect(r.verdict).toBe("practice");
  });
});

describe("rules summary", () => {
  const date = new Date(2026, 9, 25); // fall
  const passage = passageWords(passageFor(2)); // 2nd grade fall: 50th = 50, 25th = 36

  function summaryFor(spokenText: string, seconds: number) {
    const r = assess({ passage, spoken: said(spokenText), seconds, grade: 2, date });
    return { r, s: rulesSummary(summaryFacts("Leo", r)) };
  }

  it("blames accuracy, not pace, when the pace is fine", () => {
    const words = passage.slice(0, 40).map((w, i) => (i % 12 === 5 ? "blah" : w.norm));
    const { r, s } = summaryFor(words.join(" "), 30); // ~74 wcpm, ~92% accuracy
    expect(r.verdict).toBe("practice");
    expect(s.headline).toContain("good pace");
    expect(s.meaning).toContain("Speed is fine");
  });

  it("says well below when under the 25th percentile", () => {
    const words = passage.slice(0, 30).map((w) => w.norm);
    const { r, s } = summaryFor(words.join(" "), 60); // 30 wcpm
    expect(r.verdict).toBe("talkToTeacher");
    expect(s.headline).toContain("well below");
    expect(s.plan).toHaveLength(4);
    expect(s.teacherNote).toContain("30 words correct per minute");
  });
});
