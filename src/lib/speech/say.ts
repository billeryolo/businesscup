// What the games call to talk. It speaks in ReadBuddy's voice (src/lib/speech/voice.ts): a
// pre-made clip when there is one, the live voice otherwise, and the phone's own voice if neither
// can answer. Same signatures as before, so the screens didn't have to change.

import { readSettings } from "@/lib/store/settings";
import { speak, stopSpeaking } from "./voice";

/** Says it out loud. False when the voice is turned off in Family, or nothing can play sound. */
export function say(text: string): boolean {
  if (typeof window === "undefined") return false;
  if (!readSettings().voice) return false;
  const canPlay = typeof Audio !== "undefined" || "speechSynthesis" in window;
  if (canPlay) void speak(text);
  return canPlay;
}

export function hush() {
  stopSpeaking();
}
