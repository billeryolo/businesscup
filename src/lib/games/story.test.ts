import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/store/family";
import { CHILD, cleanInterest, fillChild, levelFor, LIBRARY_VARIANTS, libraryStory, mixChoices, storyFits } from "./story";

const GRADES = [-1, 0, 1, 2, 3, 4] as Grade[];

describe("story about…", () => {
  it("has a built-in story that fits for every grade and variant", () => {
    for (const grade of GRADES) {
      for (let v = 0; v < LIBRARY_VARIANTS; v++) {
        const story = libraryStory("dinosaurs", grade, v);
        expect(storyFits(story)).toBe(true);
        expect(story.pages.length).toBeLessThanOrEqual(levelFor(grade).pages);
        expect(story.pages.join(" ")).toContain("dinosaurs");
      }
    }
  });

  it("keeps the youngest stories to short sentences", () => {
    for (const page of libraryStory("cats", -1, 0).pages) {
      for (const sentence of page.split(/[.!?]/).filter((s) => s.trim())) expect(sentence.trim().split(" ").length).toBeLessThanOrEqual(7);
    }
  });

  it("puts the name in only on the phone", () => {
    const raw = libraryStory("cars", 3, 0);
    expect(JSON.stringify(raw)).toContain(CHILD);
    const filled = fillChild(raw, "Mia");
    expect(JSON.stringify(filled)).not.toContain(CHILD);
    expect(filled.pages[0]).toContain("Mia");
  });

  it("mixes the choices and still points at the right one", () => {
    const story = libraryStory("fish", 2, 1);
    for (let run = 0; run < 30; run++) {
      const mixed = mixChoices(story);
      mixed.questions.forEach((q, i) => {
        expect(q.choices[q.answer]).toBe(story.questions[i].choices[story.questions[i].answer]);
        expect([...q.choices].sort()).toEqual([...story.questions[i].choices].sort());
      });
    }
  });

  it("tidies what a parent types", () => {
    expect(cleanInterest("  pink   unicorns!! ")).toBe("pink unicorns");
    expect(cleanInterest("<b>trains</b>")).toBe("b trains b");
    expect(cleanInterest("x".repeat(80)).length).toBe(40);
  });

  it("turns down stories with the wrong shape", () => {
    const story = libraryStory("dogs", 2, 0);
    expect(storyFits({ ...story, pages: story.pages.slice(0, 1) })).toBe(false);
    expect(storyFits({ ...story, questions: [{ q: "Q?", choices: ["a", "b"], answer: 0 }] })).toBe(false);
    expect(storyFits({ ...story, questions: [{ q: "Q?", choices: ["a", "b", "c"], answer: 3 }] })).toBe(false);
  });
});
