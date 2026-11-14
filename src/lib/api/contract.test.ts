import { beforeAll, describe, expect, it } from "vitest";
import { api } from "./client";
import { endpoints } from "./contract";

// Runs every mock through the real client, so the mocks and the contract can't disagree.
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_MOCK = "1";
});

describe("API contract", () => {
  it("has unique method + path pairs", () => {
    const keys = Object.values(endpoints).map((e) => `${e.method} ${e.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("mocks match the contract for a full family flow", async () => {
    const me = await api("me");
    expect(me.children.length).toBe(2);
    const mia = me.children[0];

    const added = await api("addChild", { body: { firstName: "Ana", grade: 0 } });
    expect(added.archetype).toBe("builder");
    await expect(api("addChild", { body: { firstName: "Zed", grade: 3 } })).rejects.toMatchObject({ code: "CHILD_LIMIT" });

    const progress = await api("progress", { params: { childId: mia.id } });
    expect(progress.domains.find((d) => d.domain === "reading")?.points.length).toBe(3);

    const today = await api("todaySession", { params: { childId: mia.id } });
    expect(today.activities.length).toBeGreaterThan(0);

    const facts = await api("mathFacts", { query: { family: "add20", purpose: "check", count: 5 } });
    expect(facts.every((f) => f.answer === undefined)).toBe(true);

    const math = await api("submitMath", { body: { childId: mia.id, childName: "Mia", grade: 2, family: "add20", seconds: 60, answers: facts.map((f) => ({ factId: f.id, given: 12, responseMs: 900 })) } });
    expect(math.measure).toBe("factsPerMinute");

    const passage = await api("passage", { query: { grade: 2, purpose: "check" } });
    const reading = await api("submitReading", { body: { childId: null, childName: "Mia", grade: 2, passageId: passage.id, mode: "manual", seconds: 60, spoken: [], lastWordIndex: 50, parentMarks: [], consent: false } });
    expect(reading.claimToken).not.toBeNull();

    await api("claimCheck", { body: { claimToken: reading.claimToken!, childId: mia.id, childName: "Mia" } });
    await api("summary", { body: { claimToken: "x", childName: "Mia" } });
    await api("generateStory", { body: { childId: mia.id, interest: "dinosaurs" } });
    await api("letters", { query: { set: "all" } });
    await api("logAttempts", { params: { childId: mia.id }, body: { attempts: [{ kind: "mathFacts", skillId: "math.add20", itemId: "add:7+5", correct: true, responseMs: 800, at: new Date().toISOString() }] } });
    const checks = await api("listChecks", { query: { childId: mia.id } });
    expect(checks.length).toBeGreaterThanOrEqual(5);
    await api("getCheck", { params: { checkId: checks[0].id! } });
  });
});
