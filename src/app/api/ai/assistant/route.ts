import { z } from "zod";
import { assistantStream } from "@/lib/ai/assistant";
import { FactsShape } from "@/lib/assistant/chat";

// The parent's chat with the assistant, answered as a stream of plain text. No name comes in.

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().min(1).max(2000) })).min(1).max(20),
  facts: FactsShape,
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success || body.data.messages[0].role !== "user" || body.data.messages[body.data.messages.length - 1].role !== "user") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  return new Response(assistantStream(body.data.messages, body.data.facts), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
