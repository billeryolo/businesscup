import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { type ParentSummary, rulesSummary, type SummaryFacts } from "@/lib/reading/summary";

const MODEL = "claude-opus-5-5";
const CHILD = "{{child}}";

const SummarySchema = z.object({
  headline: z.string(),
  meaning: z.string(),
  focus: z.array(z.object({ title: z.string(), why: z.string(), tonight: z.string() })),
  plan: z.array(z.object({ week: z.number().int(), goal: z.string(), daily: z.string() })),
  teacherNote: z.string(),
});

const SYSTEM = `You write the result page of a one-minute home reading check for a parent.

You receive measured facts as JSON: words correct per minute (wcpm), accuracy, the 50th and 25th percentile for the child's grade and season from the Hasbrouck & Tindal 2017 oral reading fluency norms, a verdict, and mistake patterns with suggested practice. The child's name is replaced by the placeholder ${CHILD}: write ${CHILD} wherever you would use the name, exactly as written.

Write:
- headline: one sentence on how the reading compares with the typical pace for the grade and season.
- meaning: two or three short sentences explaining the numbers in plain words.
- focus: one or two items, built from the patterns given (or a reading-habit tip if there are none): a short title, what happened in this reading, and one concrete thing to do tonight.
- plan: exactly four weeks of 10 minutes a day, each with a goal and the daily routine; week 4 ends with a new one-minute check.
- teacherNote: three or four sentences the parent can send to the teacher, with the numbers.

Rules: use only the numbers given and quote them exactly. This is not a diagnosis: never name or suggest a condition such as dyslexia. For the verdict "talkToTeacher", say the result is worth discussing with the teacher. Warm, calm, short sentences, no exclamation marks, no jargon.`;

/** Puts the child's name back where the model wrote the placeholder. */
function fillName(summary: Omit<ParentSummary, "source">, name: string): Omit<ParentSummary, "source"> {
  const fill = (s: string) => s.split(CHILD).join(name);
  return {
    headline: fill(summary.headline),
    meaning: fill(summary.meaning),
    focus: summary.focus.map((f) => ({ title: fill(f.title), why: fill(f.why), tonight: fill(f.tonight) })),
    plan: summary.plan.map((w) => ({ ...w, goal: fill(w.goal), daily: fill(w.daily) })),
    teacherNote: fill(summary.teacherNote),
  };
}

/**
 * Claude writes the summary when ANTHROPIC_API_KEY is set; otherwise, or when the call fails
 * or is declined, the rule-based summary is returned so the result page always works.
 * The child's name never leaves this server: the model sees a placeholder.
 */
export async function writeParentSummary(facts: SummaryFacts): Promise<ParentSummary> {
  if (!process.env.ANTHROPIC_API_KEY) return rulesSummary(facts);

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(SummarySchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify({ ...facts, childName: CHILD }) }],
    });

    const parsed = response.stop_reason === "refusal" ? null : response.parsed_output;
    if (!parsed || parsed.plan.length !== 4 || parsed.focus.length === 0) return rulesSummary(facts);
    return { ...fillName({ ...parsed, focus: parsed.focus.slice(0, 2) }, facts.childName), source: "ai" };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn("Parent summary: rate limited, using rules");
    else if (error instanceof Anthropic.APIError) console.error(`Parent summary: API error ${error.status}`, error.message);
    else console.error("Parent summary failed", error);
    return rulesSummary(facts);
  }
}
