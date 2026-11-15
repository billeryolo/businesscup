import { z } from "zod";

// The interest test: a "Start 7 days free" tap. Nothing is charged and nothing about the family is
// stored; the tap is written to the server log (Vercel → Logs) so we can count plan interest.

const Body = z.object({
  plan: z.enum(["yearly", "monthly"]),
  grade: z.number().int().min(-1).max(4).nullable(),
  verdict: z.enum(["onTrack", "practice", "talkToTeacher"]).nullable(),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  console.info("trial_interest", JSON.stringify({ ...body.data, at: new Date().toISOString() }));
  return new Response(null, { status: 204 });
}
