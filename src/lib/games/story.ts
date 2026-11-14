// "Story about…": a short story about whatever the child loves, at their reading level, with
// two questions at the end. The built-in stories below are used whenever the AI writer is not
// available, so the game always works. The child's name is a placeholder until the story is
// back on the phone: the name itself is never sent anywhere.

import { z } from "zod";
import type { Grade } from "@/lib/store/family";

export const CHILD = "{{child}}";

export type TopicId = "dinosaurs" | "space" | "cats" | "dogs" | "cars" | "ocean";
export const TOPICS: { id: TopicId; label: string; interest: string; tone: string }[] = [
  { id: "dinosaurs", label: "Dinosaurs", interest: "dinosaurs", tone: "bg-mint" },
  { id: "space", label: "Space", interest: "rockets", tone: "bg-lilac" },
  { id: "cats", label: "Cats", interest: "cats", tone: "bg-peach" },
  { id: "dogs", label: "Dogs", interest: "dogs", tone: "bg-candy" },
  { id: "cars", label: "Cars", interest: "cars", tone: "bg-sky-soft" },
  { id: "ocean", label: "Ocean", interest: "fish", tone: "bg-lilac-soft" },
];

export const StoryShape = z.object({
  title: z.string(),
  pages: z.array(z.string()),
  questions: z.array(z.object({ q: z.string(), choices: z.array(z.string()), answer: z.number().int() })),
});
export type Story = z.infer<typeof StoryShape> & { source: "ai" | "library" };

export const INTEREST_MIN = 2;
export const INTEREST_MAX = 40;

/** Letters, digits, spaces, apostrophes and hyphens only, tidied up. */
export function cleanInterest(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} '’-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, INTEREST_MAX)
    .trim();
}

/** How long and how hard the story is for each grade. */
export function levelFor(grade: Grade): { easy: boolean; pages: number; guide: string } {
  if (grade <= 0) return { easy: true, pages: 3, guide: "One sentence per page, at most 6 words each. Only very common short words a 4 to 5 year old knows by ear." };
  if (grade === 1) return { easy: true, pages: 4, guide: "One or two sentences per page, at most 8 words each. Short, common, mostly decodable words." };
  if (grade === 2) return { easy: false, pages: 4, guide: "Two sentences per page, at most 12 words each. Grade 2 vocabulary." };
  return { easy: false, pages: 4, guide: `Two or three sentences per page, at most 16 words each. Grade ${grade} vocabulary with one or two richer words.` };
}

/** True when a story has the shape the game can show. */
export function storyFits(story: z.infer<typeof StoryShape>): boolean {
  const text = (s: string, max: number) => s.trim().length > 0 && s.length <= max;
  return (
    text(story.title, 60) &&
    story.pages.length >= 3 &&
    story.pages.length <= 5 &&
    story.pages.every((p) => text(p, 260)) &&
    story.questions.length >= 1 &&
    story.questions.length <= 3 &&
    story.questions.every((q) => text(q.q, 120) && q.choices.length === 3 && new Set(q.choices).size === 3 && q.choices.every((c) => text(c, 40)) && q.answer >= 0 && q.answer <= 2)
  );
}

type Draft = z.infer<typeof StoryShape>;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const EASY: ((x: string) => Draft)[] = [
  (x) => ({
    title: `${CHILD} and the box`,
    pages: [`${CHILD} loves ${x}.`, `${CHILD} sees a big box.`, `A book about ${x} is in it!`],
    questions: [
      { q: `What does ${CHILD} love?`, choices: [capital(x), "Socks", "Rain"], answer: 0 },
      { q: "What is in the box?", choices: ["A book", "A hat", "A cake"], answer: 0 },
    ],
  }),
  (x) => ({
    title: `${CHILD} can draw`,
    pages: [`${CHILD} likes ${x}.`, `${CHILD} can draw ${x}.`, `Mom is glad. ${CHILD} is glad too.`],
    questions: [
      { q: `What can ${CHILD} draw?`, choices: [capital(x), "A bus", "The sun"], answer: 0 },
      { q: "Who is glad?", choices: ["Mom", "A frog", "A duck"], answer: 0 },
    ],
  }),
];

const LONG: ((x: string) => Draft)[] = [
  (x) => ({
    title: `${CHILD} and the secret map`,
    pages: [
      `${CHILD} loved ${x} more than anything in the world.`,
      "One rainy morning, a small blue box was waiting by the door. Nobody knew who had left it.",
      `Inside was a map with a note: "Follow me to learn a secret about ${x}."`,
      `The map led to the library. There, ${CHILD} found the biggest book about ${x} ever made.`,
    ],
    questions: [
      { q: "What was waiting by the door?", choices: ["A small blue box", "A red bike", "A wet dog"], answer: 0 },
      { q: "Where did the map lead?", choices: ["To the library", "To the park", "To the school"], answer: 0 },
    ],
  }),
  (x) => ({
    title: "The drawing that winked",
    pages: [
      `Every night before bed, ${CHILD} drew pictures of ${x}.`,
      `One night, a drawing winked. ${CHILD} blinked twice and looked again.`,
      `"Thank you for drawing me so well," the picture said in a tiny voice.`,
      `From then on, ${CHILD} kept that drawing by the bed, and they shared stories until morning.`,
    ],
    questions: [
      { q: `When did ${CHILD} draw pictures?`, choices: ["Before bed", "At lunch", "On the bus"], answer: 0 },
      { q: "What did the drawing do first?", choices: ["It winked", "It ran away", "It sang a song"], answer: 0 },
    ],
  }),
];

export const LIBRARY_VARIANTS = 2;

/** A built-in story about the interest. `variant` picks which one. */
export function libraryStory(interest: string, grade: Grade, variant = 0): Story {
  const set = levelFor(grade).easy ? EASY : LONG;
  return { ...set[Math.abs(variant) % set.length](interest), source: "library" };
}

/** Puts the child's name where the placeholder is. */
export function fillChild(story: Story, name: string): Story {
  const fill = (s: string) => s.split(CHILD).join(name);
  return {
    ...story,
    title: fill(story.title),
    pages: story.pages.map(fill),
    questions: story.questions.map((q) => ({ ...q, q: fill(q.q), choices: q.choices.map(fill) })),
  };
}

/** Mixes up where the right answer sits. */
export function mixChoices(story: Story, rand: () => number = Math.random): Story {
  return {
    ...story,
    questions: story.questions.map((q) => {
      const right = q.choices[q.answer];
      const choices = [...q.choices];
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      return { ...q, choices, answer: choices.indexOf(right) };
    }),
  };
}
