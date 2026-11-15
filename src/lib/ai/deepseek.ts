import "server-only";
import type { z } from "zod";

// DeepSeek's chat API (OpenAI-compatible). Used first by the assistant, the story and the parent
// summary when DEEPSEEK_API_KEY is set; each falls back to Claude (ANTHROPIC_API_KEY) and then to
// its built-in rules, so the app always answers. The child's name never reaches the model: the
// callers send a placeholder.

const URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

export const deepseekEnabled = () => !!process.env.DEEPSEEK_API_KEY;

type Message = { role: "system" | "user" | "assistant"; content: string };

async function call(body: object, timeoutMs: number): Promise<Response> {
  return fetch(URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, ...body }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/**
 * Asks for one JSON object and checks it against the schema. `shape` is an example of the JSON,
 * shown to the model. Returns null on any failure, so the caller can fall back.
 */
export async function deepseekJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  shape: string,
  { timeoutMs = 20_000, maxTokens = 2000 } = {},
): Promise<T | null> {
  try {
    const res = await call(
      {
        messages: [
          { role: "system", content: `${system}\n\nReply with a single JSON object only, shaped exactly like this:\n${shape}` },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      timeoutMs,
    );
    if (!res.ok) {
      console.error(`DeepSeek: HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.warn("DeepSeek: reply did not match the schema");
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("DeepSeek failed", error);
    return null;
  }
}

/** Streams a chat reply as text pieces. Throws if the request fails before any text arrives. */
export async function* deepseekStream(messages: Message[], { timeoutMs = 30_000, maxTokens = 800 } = {}): AsyncGenerator<string> {
  const res = await call({ messages, stream: true, max_tokens: maxTokens, temperature: 0.6 }, timeoutMs);
  if (!res.ok || !res.body) throw new Error(`DeepSeek: HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.trim().replace(/^data:\s*/, "");
      if (!data || data === "[DONE]" || !line.trim().startsWith("data:")) continue;
      try {
        const piece = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
        if (piece) yield piece;
      } catch {
        // A partial or keep-alive line; skip it.
      }
    }
  }
}
