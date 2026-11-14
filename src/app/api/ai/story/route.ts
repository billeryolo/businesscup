import { z } from "zod";
import { writeStory } from "@/lib/ai/story";
import { cleanInterest, INTEREST_MAX, INTEREST_MIN } from "@/lib/games/story";
import type { Grade } from "@/lib/store/family";

// A story about what the child loves. No name comes in: the phone puts it into the story.

const Body = z.object({
  interest: z.string().max(200),
  grade: z.number().int().min(-1).max(4),
  variant: z.number().int().min(0).max(99).default(0),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const interest = cleanInterest(body.data.interest);
  if (interest.length < INTEREST_MIN || interest.length > INTEREST_MAX) return Response.json({ error: "Invalid interest" }, { status: 400 });
  return Response.json(await writeStory(interest, body.data.grade as Grade, body.data.variant));
}
