import { z } from "zod";
import { passageById, passageWords } from "@/lib/reading/passages";
import { type SpeechServiceResponse, transcribeFromService } from "@/lib/speech/merge";
import type { TranscribeResponse } from "@/lib/api/contract";

// "The app listens": forwards the recording to the speech service (speech/app.py on Modal),
// then decides each word from the two transcripts. The audio is passed through, never stored.
//
// POST multipart/form-data: audio (Blob), textId, seconds  →  TranscribeResponse
// GET → wakes the service so the first reading doesn't wait for a cold start.
// 503 means "mark it yourself": no service configured, or it didn't answer in time.

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel's request limit is 4.5 MB; a minute of speech is ~0.5–1 MB.
const SERVICE_TIMEOUT_MS = 25_000;

const Word = z.object({ word: z.string(), start: z.number(), end: z.number() });
const Transcript = z.object({ text: z.string(), words: z.array(Word) });
const ServiceResponse = z.object({ seconds: z.number(), ms: z.number(), wav2vec2: Transcript, whisper: Transcript });

function service(): { url: string; token: string } | null {
  const url = process.env.SPEECH_URL?.replace(/\/+$/, "");
  const token = process.env.SPEECH_TOKEN;
  return url && token ? { url, token } : null;
}

const unavailable = (why: string) => Response.json({ error: why }, { status: 503 });

async function callService(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  // One retry on a cold-start or gateway error.
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (attempt === 0 && [502, 503, 504].includes(res.status)) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt > 0 || (e instanceof Error && e.name === "TimeoutError")) throw e;
    }
  }
}

export async function POST(request: Request) {
  const svc = service();
  if (!svc) return unavailable("Speech service not configured");

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const textId = form?.get("textId");
  const seconds = Number(form?.get("seconds"));
  if (!(audio instanceof Blob) || typeof textId !== "string" || !Number.isFinite(seconds)) {
    return Response.json({ error: "Expected audio, textId and seconds" }, { status: 400 });
  }
  if (audio.size === 0 || audio.size > MAX_BYTES) return Response.json({ error: "Recording is empty or too large" }, { status: 413 });
  const passage = passageById(textId);
  if (!passage) return Response.json({ error: "Unknown text" }, { status: 404 });

  let res: Response;
  try {
    res = await callService(`${svc.url}/transcribe`, {
      method: "POST",
      headers: { authorization: `Bearer ${svc.token}`, "content-type": audio.type || "application/octet-stream" },
      body: await audio.arrayBuffer(),
    }, SERVICE_TIMEOUT_MS);
  } catch {
    return unavailable("Speech service did not answer");
  }
  if (res.status === 415 || res.status === 400) return Response.json({ error: "Could not read the recording" }, { status: 422 });
  if (!res.ok) {
    console.error("Speech service error", res.status);
    return unavailable("Speech service error");
  }

  const parsed = ServiceResponse.safeParse(await res.json().catch(() => null));
  if (!parsed.success) return unavailable("Speech service gave an unexpected answer");
  const result: TranscribeResponse = transcribeFromService(passageWords(passage), parsed.data as SpeechServiceResponse);
  return Response.json(result);
}

export async function GET() {
  const svc = service();
  if (!svc) return unavailable("Speech service not configured");
  // Don't wait for the GPU to boot; the request itself starts it.
  fetch(`${svc.url}/warm`, { headers: { authorization: `Bearer ${svc.token}` }, signal: AbortSignal.timeout(3000) }).catch(() => {});
  return new Response(null, { status: 202 });
}
