// What the games call to talk. It speaks in ReadBuddy's voice (src/lib/speech/voice.ts): a
// pre-made clip when there is one, the live voice otherwise, and the phone's own voice if neither
// can answer. Same signatures as before, so the screens didn't have to change.

import { speak, stopSpeaking } from "./voice";

/** Says it out loud. False only when this browser can play no sound at all. */
export function say(text: string): boolean {
  if (typeof window === "undefined") return false;
  const canPlay = typeof Audio !== "undefined" || "speechSynthesis" in window;
  if (canPlay) void speak(text);
  return canPlay;
}

export function hush() {
  stopSpeaking();
}
