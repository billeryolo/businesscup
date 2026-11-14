import { z } from "zod";

// Text in, mp3 out, in ReadBuddy's voice (Kokoro on Modal, the Voice class in speech/app.py).
// POST { text } → audio/mpeg. 503 means "use the phone's own voice" (src/lib/speech/voice.ts does).
// GET wakes the voice service so the first story page doesn't wait.

export const maxDuration = 60;

const Body = z.object({ text: z.string().trim().min(1).max(2000) });

function service(): { url: string; token: string } | null {
  const url = process.env.VOICE_URL?.replace(/\/+$/, "");
  const token = process.env.SPEECH_TOKEN;
  return url && token ? { url, token } : null;
}

const unavailable = (why: string) => Response.json({ error: why }, { status: 503 });

export async function POST(request: Request) {
  const svc = service();
  if (!svc) return unavailable("Voice not configured");
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Expected { text } up to 2000 characters" }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(`${svc.url}/speak`, {
      method: "POST",
      headers: { authorization: `Bearer ${svc.token}`, "content-type": "application/json" },
      body: JSON.stringify({ text: body.data.text }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return unavailable("Voice did not answer");
  }
  if (!res.ok) {
    console.error("Voice service error", res.status);
    return unavailable("Voice error");
  }
  // The same text always sounds the same, so the phone may keep it for a day.
  return new Response(res.body, { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400" } });
}

export async function GET() {
  const svc = service();
  if (!svc) return unavailable("Voice not configured");
  fetch(`${svc.url}/warm`, { headers: { authorization: `Bearer ${svc.token}` }, signal: AbortSignal.timeout(3000) }).catch(() => {});
  return new Response(null, { status: 202 });
}
