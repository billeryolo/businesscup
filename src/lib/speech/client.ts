"use client";

// For the reading check screen: record the minute, send it, get each word back.
//
//   warmSpeech();                                  // when the check screen opens
//   const rec = await startRecording();            // after "Start" (asks for the microphone)
//   const { audio, seconds } = await rec.stop();   // after 60 s or "Stop"
//   const heard = await transcribeReading({ audio, textId, seconds });
//   if (!heard) → switch to "I'll mark it myself" with the same text
//   else → review screen: highlight heard.toReview, then finishReading() and buildResult()

import type { TranscribeResponse } from "@/lib/api/contract";

const TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];

export function recordingSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function pickType(): string | undefined {
  return TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export type Recording = {
  /** Stops recording and releases the microphone. `seconds` is how long it ran (at most 60). */
  stop(): Promise<{ audio: Blob; seconds: number }>;
  /** Stops without keeping anything. */
  cancel(): void;
};

/** Throws if the microphone is denied or unavailable. */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
  const mimeType = pickType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start(1000);
  const startedAt = performance.now();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop: () =>
      new Promise((resolve) => {
        const seconds = Math.min(60, (performance.now() - startedAt) / 1000);
        recorder.onstop = () => {
          release();
          resolve({ audio: new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }), seconds });
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = release;
      if (recorder.state !== "inactive") recorder.stop();
      else release();
      chunks.length = 0;
    },
  };
}

/** Wakes the speech service in the background. Safe to call often. */
export function warmSpeech(): void {
  fetch("/api/transcribe", { method: "GET" }).catch(() => {});
}

/** null means: fall back to the parent marking by hand (service down, too slow, or unreadable). */
export async function transcribeReading({
  audio,
  textId,
  seconds,
  timeoutMs = 30_000,
}: {
  audio: Blob;
  textId: string;
  seconds: number;
  timeoutMs?: number;
}): Promise<TranscribeResponse | null> {
  const form = new FormData();
  form.append("audio", audio, "reading");
  form.append("textId", textId);
  form.append("seconds", String(seconds));
  try {
    const res = await fetch("/api/transcribe", { method: "POST", body: form, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return (await res.json()) as TranscribeResponse;
  } catch {
    return null;
  }
}
