"use client";

// The browser's built-in speech recognition (Chrome, Edge, Safari), following a child reading
// aloud. Every word gets the time it was first heard, which the pause detection uses.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SpokenWord } from "@/lib/reading/align";
import { tokenizeTranscript } from "@/lib/reading/text";

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

/** False on the server and in browsers without speech recognition. */
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(noSubscribe, () => recognitionConstructor() !== null, () => false);
}

export type SpeechError = "microphone" | "network" | "other";

export function useSpeechRecognition() {
  const [words, setWords] = useState<SpokenWord[]>([]);
  const [error, setError] = useState<SpeechError | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const active = useRef(false);
  const committed = useRef<string[]>([]);
  const current = useRef<string[]>([]);
  const firstHeard = useRef<number[]>([]);
  const startedAt = useRef(0);

  const publish = useCallback(() => {
    const tokens = [...committed.current, ...current.current];
    const now = (performance.now() - startedAt.current) / 1000;
    tokens.forEach((_, i) => {
      if (firstHeard.current[i] === undefined) firstHeard.current[i] = Math.round(now * 10) / 10;
    });
    setWords(tokens.map((norm, i) => ({ norm, t: firstHeard.current[i] })));
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor) {
      setError("other");
      return;
    }
    committed.current = [];
    current.current = [];
    firstHeard.current = [];
    setWords([]);
    setError(null);

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = Array.from(event.results, (r) => r[0].transcript).join(" ");
      current.current = tokenizeTranscript(text);
      publish();
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      active.current = false;
      setError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "microphone" : event.error === "network" ? "network" : "other");
    };
    // Browsers end recognition after silences; keep listening until we're told to stop.
    rec.onend = () => {
      committed.current = [...committed.current, ...current.current];
      current.current = [];
      if (active.current) rec.start();
    };

    recognition.current = rec;
    active.current = true;
    startedAt.current = performance.now();
    rec.start();
  }, [publish]);

  const stop = useCallback(() => {
    active.current = false;
    recognition.current?.stop();
  }, []);

  useEffect(() => () => {
    active.current = false;
    recognition.current?.abort();
  }, []);

  return { words, error, start, stop };
}
