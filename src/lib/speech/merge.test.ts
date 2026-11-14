import { describe, expect, it } from "vitest";
import { tokenizePassage } from "@/lib/reading/text";
import { finishReading, transcribeFromService, type ServiceTranscript } from "./merge";

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

  it("counts an unconfirmed check word as correct", () => {
    const { items } = finishReading(passage, heard, new Set());
    expect(items).toHaveLength(8);
    expect(items[1]).toMatchObject({ kind: "word", status: "correct", text: "horse" });
  });

  it("counts a check word the parent tapped as misread", () => {
    const { items } = finishReading(passage, heard, new Set([1]));
    expect(items[1]).toMatchObject({ status: "misread", heard: "hose" });
  });

  it("lets the parent flip any other word", () => {
    const { items } = finishReading(passage, heard, new Set([3]));
    expect(items[3]).toMatchObject({ status: "misread", text: "to" });
  });
});
