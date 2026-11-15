"use client";

// Hold to talk: the browser's own speech recognition turns a spoken question into text for the
// assistant. Unlike the reading check, the words are kept as said (capitals, punctuation).

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

export function useDictation(onDone: (text: string) => void) {
  const supported = useSyncExternalStore(noSubscribe, () => ctor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const rec = useRef<Recognition | null>(null);
  const text = useRef("");
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const start = useCallback(() => {
    const Ctor = ctor();
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    text.current = "";
    setHeard("");
    r.onresult = (e) => {
      text.current = Array.from(e.results, (x) => x[0].transcript).join(" ").replace(/\s+/g, " ").trim();
      setHeard(text.current);
    };
    r.onerror = () => {};
    r.onend = () => {
      rec.current = null;
      setListening(false);
      if (text.current) done.current(text.current);
    };
    rec.current = r;
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, heard, start, stop };
}
