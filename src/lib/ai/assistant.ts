import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { deepseekEnabled, deepseekStream } from "./deepseek";
import { type AssistantFacts, type ChatMessage, CHILD, rulesReply } from "@/lib/assistant/chat";

const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the assistant inside ReadBuddy, a phone app where a parent helps a child from Pre-K to grade 4 with letters, reading, numbers and math at home. You talk with the parent.

The child's name is replaced by the placeholder ${CHILD}: write ${CHILD} wherever you would use the name, exactly as written, and never use "he" or "she" for the child.

What the app has: a daily practice of a few minutes made of short games (Hear a letter, Big word, Speed math, Story about…), stars and a streak, and a 1-minute check for reading, math facts or letters that gives a score per minute compared with a goal for the grade.

How to answer:
- Short: two to five sentences, or a few lines starting with "- " when listing steps. Plain text only, no headings, bold or emoji.
- Use only the numbers in the facts below and quote them exactly. If something is not in the facts, say you do not have it yet and how to get it (usually: do a 1-minute check).
- Give one concrete thing to do tonight when it fits, sized to the child's daily minutes.
- Warm and calm. Never blame the child or the parent.
- This is not a diagnosis: never name or suggest a condition such as dyslexia or ADHD. When the parent is worried or a check says "talkToTeacher", suggest talking with the teacher and offer to draft the note.
- Stay on learning at home and this app. For anything else, say briefly that you can only help with that.`;

const encoder = new TextEncoder();

/** The built-in answer, sent a few words at a time so the screen behaves the same either way. */
function rulesStream(question: string, facts: AssistantFacts): ReadableStream<Uint8Array> {
  const words = rulesReply(question, facts).split(/(?<=\s)/);
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i += 3) {
        controller.enqueue(encoder.encode(words.slice(i, i + 3).join("")));
        await new Promise((done) => setTimeout(done, 45));
      }
      controller.close();
    },
  });
}

/**
 * Claude answers when ANTHROPIC_API_KEY is set; otherwise, or when the call fails or is declined
 * before any text arrives, the built-in answer is sent so the chat always works. The child's
 * name is not part of the request: the phone swaps it for a placeholder and back.
 */
export function assistantStream(messages: ChatMessage[], facts: AssistantFacts): ReadableStream<Uint8Array> {
  const question = messages[messages.length - 1].text;
  if (deepseekEnabled()) return deepseekAssistant(messages, facts);
  if (!process.env.ANTHROPIC_API_KEY) return rulesStream(question, facts);

  return new ReadableStream({
    async start(controller) {
      let sent = false;
      try {
        const client = new Anthropic();
        const stream = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 4000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "low" },
            system: `${SYSTEM}\n\nFacts about ${CHILD}, measured by the app:\n${JSON.stringify(facts)}`,
            messages: messages.map((m) => ({ role: m.role, content: m.text })),
          },
          { maxRetries: 1 },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
            sent = true;
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !sent) controller.enqueue(encoder.encode(rulesReply(question, facts)));
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) console.warn("Assistant: rate limited, using the built-in answer");
        else if (error instanceof Anthropic.APIError) console.error(`Assistant: API error ${error.status}`, error.message);
        else console.error("Assistant failed", error);
        if (!sent) controller.enqueue(encoder.encode(rulesReply(question, facts)));
      }
      controller.close();
    },
  });
}

/** DeepSeek answers first when DEEPSEEK_API_KEY is set; the built-in answer covers any failure. */
function deepseekAssistant(messages: ChatMessage[], facts: AssistantFacts): ReadableStream<Uint8Array> {
  const question = messages[messages.length - 1].text;
  return new ReadableStream({
    async start(controller) {
      let sent = false;
      try {
        const system = `${SYSTEM}

Facts about ${CHILD}, measured by the app:
${JSON.stringify(facts)}`;
        for await (const piece of deepseekStream([{ role: "system", content: system }, ...messages.slice(-10).map((m) => ({ role: m.role, content: m.text }))])) {
          controller.enqueue(encoder.encode(piece));
          sent = true;
        }
      } catch (error) {
        console.error("Assistant (DeepSeek) failed", error);
      }
      if (!sent) controller.enqueue(encoder.encode(rulesReply(question, facts)));
      controller.close();
    },
  });
}
