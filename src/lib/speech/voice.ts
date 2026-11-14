// ReadBuddy's voice. Three ways to say something, best first:
//   1. a pre-made clip (public/audio, listed in clips.json): instant, works offline
//   2. the live voice (/api/speak → Kokoro on Modal): for stories and anything new
//   3. the phone's own voice (speechSynthesis): when the other two can't answer
//
// One shared <audio> element plays everything. Phones only allow sound after a tap, so the first
// tap anywhere "unlocks" it; later sounds can then start after a fetch.

import clips from "./clips.json";

const CLIPS = clips as Record<string, string>;
const LIVE_TIMEOUT_MS = 12_000;

let player: HTMLAudioElement | null = null;
let unlocked = false;
/** Bumped by every new speak() or stop(), so a slow fetch never talks over a newer line. */
let turn = 0;
const fetched = new Map<string, Promise<string | null>>();

// A short silent clip, played once on the first tap to unlock audio on iPhone.
const SILENCE = "/audio/silence.mp3";

function getPlayer(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!player) {
    player = new Audio();
    player.preload = "auto";
    const unlock = () => {
      if (unlocked || !player) return;
      unlocked = true;
      const p = player;
      p.src = SILENCE;
      p.play().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
  }
  return player;
}

if (typeof window !== "undefined") getPlayer();

export const hasClip = (text: string) => text in CLIPS;

function phoneVoice(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.8;
  u.pitch = 1.15;
  window.speechSynthesis.speak(u);
  return true;
}

/** Fetches the live voice for a line once; later calls reuse it. null when it can't answer. */
function live(text: string): Promise<string | null> {
  let pending = fetched.get(text);
  if (!pending) {
    pending = fetch("/api/speak", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
    })
      .then(async (res) => (res.ok ? URL.createObjectURL(await res.blob()) : null))
      .catch(() => null);
    fetched.set(text, pending);
    // A failure is not remembered, so the next try asks again.
    pending.then((url) => url ?? fetched.delete(text));
  }
  return pending;
}

function play(src: string, myTurn: number): Promise<boolean> {
  const p = getPlayer();
  if (!p || myTurn !== turn) return Promise.resolve(false);
  p.pause();
  p.src = src;
  p.currentTime = 0;
  return p.play().then(
    () => true,
    () => false,
  );
}

/**
 * Says a line. Resolves true once it started (clip, live voice or phone voice), false when nothing
 * could speak or a newer line took over. Call it straight from a tap the first time.
 */
export async function speak(text: string): Promise<boolean> {
  const myTurn = ++turn;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();

  const clip = CLIPS[text];
  if (clip && (await play(clip, myTurn))) return true;
  if (myTurn !== turn) return false;

  const url = await live(text);
  if (myTurn !== turn) return false;
  if (url && (await play(url, myTurn))) return true;
  if (myTurn !== turn) return false;

  return phoneVoice(text);
}

/** Starts fetching lines that will be said soon (the next story pages), so they play at once. */
export function prefetchSpeech(texts: string[]): void {
  if (typeof window === "undefined") return;
  for (const t of texts) if (!hasClip(t)) void live(t);
}

/** Stops whatever is being said. */
export function stopSpeaking(): void {
  turn++;
  player?.pause();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Wakes the live voice in the background (e.g. when the story game opens). */
export function warmVoice(): void {
  if (typeof window !== "undefined") fetch("/api/speak", { method: "GET" }).catch(() => {});
}
