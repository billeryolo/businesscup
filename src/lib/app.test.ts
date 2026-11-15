import { describe, expect, it } from "vitest";

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
