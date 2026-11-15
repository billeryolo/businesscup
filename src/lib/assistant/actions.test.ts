import { describe, expect, it } from "vitest";
import { demoChecks } from "@/lib/store/demo-checks";
import { cardsFor } from "./actions";

const checks = demoChecks(new Date(2026, 10, 14), { mia: "mia", leo: "leo" }).filter((c) => c.kidId === "mia");
const ctx = { checks, minutes: 15 };
const kinds = (m: string) => cardsFor(m, ctx).map((c) => c.kind);

describe("assistant action cards", () => {
  it("saves a struggle to the diary and offers the matching game", () => {
    const cards = cardsFor("She struggled with her homework today, mixing up b and d.", ctx);
    expect(cards.map((c) => c.kind)).toEqual(["diary", "open"]);
    expect(cards[1]).toMatchObject({ href: "/play/hear-a-letter" });
  });

  it("logs reading time", () => {
    expect(cardsFor("We read a library book together for 20 minutes.", ctx)[0]).toEqual({ kind: "minutes", minutes: 20 });
  });

  it("proposes shorter or longer practice for the parent to apply", () => {
    expect(cardsFor("Make practice shorter on weekdays.", ctx)[0]).toEqual({ kind: "change", from: 15, to: 10, status: "pending" });
    expect(cardsFor("Can we do more practice?", ctx)[0]).toMatchObject({ kind: "change", to: 20 });
    expect(cardsFor("Make it shorter", { checks, minutes: 5 })).toEqual([]);
  });

  it("shows a mini chart when asked how the child is doing", () => {
    const chart = cardsFor("How is Mia doing this week?", ctx)[0];
    expect(chart).toMatchObject({ kind: "chart", label: "words a minute", scores: [36, 39, 41, 47], target: 50, change: "+11 since Oct 17" });
    expect(kinds("Is he behind? Should I worry?")).toContain("chart");
  });

  it("opens the teacher report when asked for a note", () => {
    expect(kinds("Write a note to her teacher.")).toContain("report");
  });

  it("adds nothing to a plain question", () => {
    expect(kinds("What is phonics?")).toEqual([]);
  });
});
