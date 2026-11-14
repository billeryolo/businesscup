"use client";

// Plays a scripted reading in real time, for trying the app without a child or a microphone.
// The UI always labels it as a demo recording.

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpokenWord } from "@/lib/reading/align";
import { type ReaderProfile, simulateReading } from "@/lib/reading/simulate";
import type { PassageWord } from "@/lib/reading/text";

export function useDemoReader(passage: PassageWord[], profile: ReaderProfile) {
  const [words, setWords] = useState<SpokenWord[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    const script = simulateReading(passage, profile);
    const startedAt = performance.now();
    setWords([]);
    timer.current = setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      setWords(script.filter((w) => (w.t ?? 0) <= elapsed));
    }, 150);
  }, [passage, profile, stop]);

  useEffect(() => stop, [stop]);

  return { words, error: null, start, stop };
}
