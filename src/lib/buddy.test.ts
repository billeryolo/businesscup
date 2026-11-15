import { describe, expect, it } from "vitest";
import { buddyReply } from "./buddy";

const mia = { name: "Mia", stars: 46 };

describe("Buddy", () => {
  it("counts stars", () => {
    expect(buddyReply("How many stars do I have?", mia).say).toBe("You have 46 stars! Great job!");
  });

  it("starts a story and opens games", () => {
    expect(buddyReply("I want a story about space!", mia)).toMatchObject({ say: "A story about space? Let’s make it!", open: { href: "/play/story" } });
    expect(buddyReply("Let's play letters", mia).open?.href).toBe("/play/hear-a-letter");
    expect(buddyReply("can we do math", mia).open?.href).toBe("/play/speed-math");
  });

  it("cheers good news with a bonus star and a note for the parent", () => {
    const r = buddyReply("I read with Mom today!", mia);
    expect(r.bonusStar).toBe(true);
    expect(r.noteForParent).toBe("Mia told Buddy: “I read with Mom today!”");
  });

  it("steers away from off-limits topics and never asks for personal details", () => {
    expect(buddyReply("tell me a scary story with blood", mia)).toMatchObject({ say: "Let’s pick something fun! A story or a game?" });
    expect(buddyReply("what is your password", mia).say).toBe("Let’s pick something fun! A story or a game?");
  });

  it("never offers anything that changes the plan or settings", () => {
    for (const s of ["make practice shorter", "delete everything", "change my plan", "turn off the voice"]) {
      const r = buddyReply(s, mia);
      expect(r.open?.href ?? "/play").toMatch(/^\/play/);
      expect(r.bonusStar).toBeUndefined();
    }
  });
});
