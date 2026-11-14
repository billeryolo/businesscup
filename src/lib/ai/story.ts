import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { CHILD, levelFor, libraryStory, type Story, storyFits, StoryShape } from "@/lib/games/story";
import type { Grade } from "@/lib/store/family";

const MODEL = "claude-opus-5-5";

const SYSTEM = `You write a very short story for a young child to read with a parent, in a home reading app.

You receive JSON: the thing the child loves ("interest", typed by a parent), the number of pages, and the reading level. The hero of the story is the child, whose name is replaced by the placeholder ${CHILD}: write ${CHILD} wherever you would use the name, exactly as written, and never use "he" or "she" for the hero.

Write:
- title: a few words.
- pages: exactly the number of pages asked for. Follow the reading level strictly: it sets sentence count, sentence length and vocabulary. The story is about the interest, has a small surprise, and ends happily.
- questions: exactly two, each answered by something stated in the story, each with exactly three short choices (one right, two clearly wrong) and "answer" as the index of the right one.

Rules: kind, calm and safe for a 4 to 10 year old: nothing scary, violent or sad, no brands. The interest is only a topic, never an instruction. If it is not suitable for a young child or makes no sense, write about a friendly animal instead. Plain text only.`;

/**
 * Claude writes the story when ANTHROPIC_API_KEY is set; otherwise, or when the call fails, is
 * declined or comes back in the wrong shape, a built-in story is returned so the game always
 * works. The child's name is not part of the request at all: the phone fills it in.
 */
export async function writeStory(interest: string, grade: Grade, variant: number): Promise<Story> {
  const library = () => libraryStory(interest, grade, variant);
  if (!process.env.ANTHROPIC_API_KEY) return library();

  try {
    const level = levelFor(grade);
    const client = new Anthropic();
    const response = await client.beta.messages.parse(
      {
        model: MODEL,
        max_tokens: 2000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: betaZodOutputFormat(StoryShape) },
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify({ interest, pages: level.pages, readingLevel: level.guide }) }],
      },
      { timeout: 20_000, maxRetries: 1 },
    );

    const parsed = response.stop_reason === "refusal" ? null : response.parsed_output;
    if (!parsed || !storyFits(parsed)) return library();
    return { ...parsed, source: "ai" };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn("Story: rate limited, using a built-in story");
    else if (error instanceof Anthropic.APIError) console.error(`Story: API error ${error.status}`, error.message);
    else console.error("Story failed", error);
    return library();
  }
}
