import { describe, expect, it } from "vitest";
import { tokenizeTranscript } from "./reading/text";
import { assess } from "./reading/assess";
import { passageFor, passageWords } from "./reading/passages";
import { encodeStatuses, toRecord } from "./reading/record";
import { safeNext } from "./safe-next";

describe("reading record", () => {
  const passage = passageWords(passageFor(2));
  const spoken = tokenizeTranscript("On the first hot day of summer Maya and her sister Leo wanted to sell").map((norm) => ({ norm }));
  const a = assess({ passage, spoken, seconds: 20, grade: 2, date: new Date(Date.UTC(2026, 10, 4)) });

  it("stores one letter per attempted word and nothing about what was said", () => {
    const record = toRecord(a, "g2-lemonade", "live", new Date(Date.UTC(2026, 10, 4)));
    // "brother" (the 11th word) was read as "sister".
    expect(record.wordStatuses).toBe("ccccccccccmcccc");
    expect(record.wordStatuses).toHaveLength(record.attempted);
    expect(JSON.stringify(record)).not.toContain("sister");
    expect(record).toMatchObject({ grade: 2, season: "fall", mode: "live", errors: 1, passageId: "g2-lemonade" });
  });

  it("encodes skipped words", () => {
    const words = [
      { index: 0, status: "correct" as const },
      { index: 1, status: "skipped" as const },
      { index: 2, status: "misread" as const },
      { index: 3, status: "unreached" as const },
    ];
    expect(encodeStatuses(words, 2)).toBe("csm");
  });
});

describe("safeNext", () => {
  it("only allows same-site paths", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});

describe("weekly reminder", () => {
  it("builds a valid weekly calendar event at 6 pm a week from now", async () => {
    const { nextReminderStart, weeklyReminderIcs } = await import("./calendar");
    const now = new Date(2026, 10, 4, 21, 15);
    const start = nextReminderStart(now);
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([11, 18, 0]);
    const ics = weeklyReminderIcs({ childName: "Maya, Jr.", url: "https://example.com/check?child=abc", start, now, uid: "u1" });
    expect(ics).toContain("DTSTART:20261111T180000\r\n");
    expect(ics).toContain("DTEND:20261111T181500\r\n");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;COUNT=4\r\n");
    expect(ics).toContain("SUMMARY:Reading check for Maya\\, Jr.\r\n");
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
