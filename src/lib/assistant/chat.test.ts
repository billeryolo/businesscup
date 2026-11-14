import { describe, expect, it } from "vitest";
import type { CheckRecord } from "@/lib/store/checks";
import type { Kid } from "@/lib/store/family";
import { CHILD, factsFor, FactsShape, hideName, rulesReply, showName } from "./chat";

const mia: Kid = { id: "k1", name: "Mia", grade: 2, avatar: "lion", stars: 57, streakDays: 4 };
const now = new Date("2026-11-14T12:00:00Z").getTime();
const check: CheckRecord = { id: "c1", kidId: "k1", kind: "reading", at: "2026-11-12T12:00:00Z", score: 61, accuracy: 0.94, target: 72, verdict: "practice" };

describe("assistant", () => {
  it("describes the child without the name", () => {
    const facts = factsFor(mia, [check], now);
    expect(FactsShape.safeParse(facts).success).toBe(true);
    expect(JSON.stringify(facts)).not.toContain("Mia");
    expect(facts.checks[0]).toMatchObject({ score: 61, target: 72, accuracyPercent: 94, daysAgo: 2 });
    expect(facts.today.length).toBe(3);
  });

  it("hides the name as a whole word, any case, and puts it back", () => {
    expect(hideName("How is Mia doing? mia's book. Miami.", "Mia")).toBe(`How is ${CHILD} doing? ${CHILD}'s book. Miami.`);
    expect(showName(`${CHILD} read well. Go ${CHILD}!`, "Mia")).toBe("Mia read well. Go Mia!");
    expect(hideName("a.b", "a.b")).toBe(CHILD);
  });

  it("answers from the numbers it was given", () => {
    const facts = factsFor(mia, [check], now);
    const explain = rulesReply("What does the last check mean?", facts);
    expect(explain).toContain("61 words a minute");
    expect(explain).toContain("11 short");
    expect(rulesReply("what should we practice tonight", facts)).toContain("15 minutes");
    expect(rulesReply("write a note to the teacher", facts)).toContain("94% correct");
    expect(rulesReply("she is bored", facts)).toContain("57");
    expect(rulesReply("Mia cries when we do math", facts)).toContain("take turns");
    expect(rulesReply("what should we practice tonight", facts)).not.toContain("….");
    for (const q of ["hello", "How is she doing?", "fun", "plan", "teacher", "check"]) {
      const reply = rulesReply(q, facts);
      expect(reply).not.toContain("Mia");
      expect(reply.length).toBeGreaterThan(40);
    }
  });

  it("says so when there is no check yet", () => {
    const facts = factsFor(mia, [], now);
    expect(rulesReply("explain the check", facts)).toContain("no 1-minute check yet");
    expect(rulesReply("teacher note", facts)).toContain("check first");
  });
});
