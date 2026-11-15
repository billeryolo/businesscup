// Buddy: the assistant for the child. Safe by design: a child's words never go to an AI model.
// Buddy answers on the phone with short, friendly lines and can only cheer, count stars, start a
// story or open a game. It cannot change the plan, the settings or delete anything (that's the
// parent's assistant, behind the 3-second Parent hold).

export type BuddyReply = {
  say: string;
  open?: { label: string; href: string };
  /** A bonus star for good news ("I read with Mom!"). */
  bonusStar?: boolean;
  /** A line for the parent's diary. */
  noteForParent?: string;
};

// Topics a young child shouldn't be steered into, and personal details Buddy never asks about.
const OFF_LIMITS = /\b(kill|blood|die|dead|gun|knife|scary|monster|hate|stupid|address|password|phone number|where do you live|secret)\b/i;

export const BUDDY_CHIPS = [
  { label: "Tell me a story", ask: "Tell me a story" },
  { label: "How many stars?", ask: "How many stars do I have?" },
  { label: "Let’s play letters", ask: "Let's play letters" },
  { label: "I read today!", ask: "I read a book today!" },
];

export function buddyReply(said: string, kid: { name: string; stars: number }): BuddyReply {
  const text = said.trim();
  if (!text) return { say: `Hi ${kid.name}! Do you want a story or a game?` };
  if (OFF_LIMITS.test(text)) return { say: "Let’s pick something fun! A story or a game?", open: { label: "Story time", href: "/play/story" } };

  if (/\b(i|we) (read|did reading|practi[cs]ed)\b/i.test(text) || /\bread with\b/i.test(text)) {
    return { say: `Wow, ${kid.name}! That’s amazing. Here’s a bonus star!`, bonusStar: true, noteForParent: `${kid.name} told Buddy: “${text}”` };
  }
  if (/\bstars?\b/i.test(text)) return { say: kid.stars === 1 ? "You have 1 star! Let’s get more!" : `You have ${kid.stars} stars! Great job!` };
  if (/\b(story|stories|tell me about|once upon)\b/i.test(text)) {
    const about = /\babout (?:a |an |the )?([a-z][a-z ]{1,24})/i.exec(text)?.[1]?.trim();
    return { say: about ? `A story about ${about}? Let’s make it!` : "Yes! Let’s make a story. What do you love?", open: { label: "Make a story", href: "/play/story" } };
  }
  if (/\b(letters?|abc|alphabet)\b/i.test(text)) return { say: "Letters! Let’s play Hear a letter.", open: { label: "Hear a letter", href: "/play/hear-a-letter" } };
  if (/\b(math|numbers?|count|adding|sums?)\b/i.test(text)) return { say: "Numbers! Let’s play Speed math.", open: { label: "Speed math", href: "/play/speed-math" } };
  if (/\b(words?|big word|read)\b/i.test(text)) return { say: "Let’s build a big word!", open: { label: "Big word", href: "/play/big-word" } };
  if (/\b(hi|hello|hey)\b/i.test(text)) return { say: `Hi ${kid.name}! I can tell stories, count your stars and play games.` };
  return { say: "I can tell stories, count your stars and play games with you. What shall we do?" };
}
