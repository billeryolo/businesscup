import { describe, expect, it } from "vitest";
import { tokenizePassage } from "@/lib/reading/text";
import { assessHeard, transcribeFromService, type ServiceTranscript } from "./merge";

const passage = tokenizePassage("The horse ran to the big red barn and ate some hay with the cow.");

const said = (text: string): ServiceTranscript => ({
  text,
  words: text.split(" ").map((word, i) => ({ word, start: i * 0.5, end: i * 0.5 + 0.4 })),
});

const run = (w2v: string, whisper: string) =>
  transcribeFromService(passage, { seconds: 10, ms: 900, wav2vec2: said(w2v), whisper: said(whisper) });

describe("merging wav2vec2 and Whisper", () => {
  it("marks words both models heard right as correct", () => {
    const r = run("the horse ran to the big red barn", "The horse ran to the big red barn.");
    expect(r.lastAttempted).toBe(7);
    expect(r.words.slice(0, 8).every((w) => w.status === "correct")).toBe(true);
    expect(r.words[8].status).toBe("unreached");
    expect(r.toReview).toEqual([]);
    expect(r.ms).toBe(900);
  });

  it("counts a mistake both models heard", () => {
    const r = run("the house ran to the big red barn", "The house ran to the big red barn.");
    expect(r.words[1]).toMatchObject({ status: "misread", heard: "house" });
  });

  it("sends a disagreement to the parent", () => {
    // wav2vec2 hears the misreading, Whisper "fixes" it.
    const r = run("the hose ran to the big red barn", "The horse ran to the big red barn.");
    expect(r.words[1]).toMatchObject({ status: "check", heard: "hose" });
    expect(r.toReview).toEqual([1]);
  });

  it("checks words only one model heard past the other's end", () => {
    const r = run("the horse ran to the big red barn and eight", "The horse ran to the big red barn.");
    expect(r.lastAttempted).toBe(9);
    expect(r.words[8].status).toBe("correct");
    expect(r.words[9].status).toBe("correct"); // "eight" = "ate" (homophone)
  });

  it("counts skipped words both models missed", () => {
    const r = run("the horse ran to the barn and ate", "The horse ran to the barn and ate.");
    expect(r.words[5].status).toBe("skipped");
    expect(r.words[6].status).toBe("skipped");
  });
});

describe("finishing after the review", () => {
  const heard = run("the hose ran to the big red barn", "The horse ran to the big red barn.");

  const finish = (flipped: number[]) =>
    assessHeard({ passage, heard, flipped: new Set(flipped), seconds: 8, grade: 2, date: new Date(2026, 10, 14) });

  it("counts an unconfirmed check word as correct", () => {
    const a = finish([]);
    expect(a.score).toMatchObject({ attempted: 8, correct: 8, errors: 0, wcpm: 60 });
    expect(a.alignment.words[1]).toMatchObject({ status: "correct" });
  });

  it("counts a check word the parent tapped as misread", () => {
    const a = finish([1]);
    expect(a.alignment.words[1]).toMatchObject({ status: "misread", heard: "hose" });
    expect(a.score.errors).toBe(1);
  });

  it("lets the parent flip any other word", () => {
    expect(finish([3]).alignment.words[3]).toMatchObject({ status: "misread" });
  });

  it("gives the same verdict rules as any other reading check", () => {
    // Grade 2 in the fall: 60 wcpm is above the median (50); one error in 8 is under 90% accuracy.
    expect(finish([]).verdict).toBe("onTrack");
    expect(finish([1]).verdict).toBe("talkToTeacher");
  });
});
