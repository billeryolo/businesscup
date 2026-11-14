import { readSettings } from "@/lib/store/settings";

/** Says it out loud with the phone's own voice. False when the phone has none or the voice is off. */
export function say(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  if (!readSettings().voice) return false;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-US";
  voice.rate = 0.8;
  voice.pitch = 1.15;
  window.speechSynthesis.speak(voice);
  return true;
}

export function hush() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
