"use client";

// Backend test bench for "the app listens": record or upload a reading, see what each model
// decided, tap words like the parent would, and get the result. Unstyled on purpose.

import { useEffect, useMemo, useRef, useState } from "react";
import type { TranscribeResponse } from "@/lib/api/contract";
import { readingView, type ResultView } from "@/lib/checks/result";
import { PASSAGES, passageById, passageWords } from "@/lib/reading/passages";
import { startRecording, transcribeReading, warmSpeech, type Recording } from "@/lib/speech/client";
import { assessHeard } from "@/lib/speech/merge";

const COLORS = { correct: "#2a7", misread: "#d33", skipped: "#d33", check: "#e90", unreached: "#999" } as const;

export default function SpeechDevPage() {
  const [textId, setTextId] = useState(PASSAGES.find((p) => p.grade === 2)!.id);
  const passage = passageById(textId)!;
  const words = useMemo(() => passageWords(passage), [passage]);

  const [recording, setRecording] = useState<Recording | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [status, setStatus] = useState("");
  const [heard, setHeard] = useState<TranscribeResponse | null>(null);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ResultView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => warmSpeech(), []);

  const send = async (audio: Blob, secs: number) => {
    setStatus(`Sending ${(audio.size / 1024).toFixed(0)} KB…`);
    const t0 = performance.now();
    const res = await transcribeReading({ audio, textId, seconds: secs });
    const total = Math.round(performance.now() - t0);
    if (!res) {
      setStatus(`No answer in ${total} ms: the app would switch to "I'll mark it myself".`);
      return;
    }
    setHeard(res);
    setFlipped(new Set());
    setResult(null);
    setStatus(`Done in ${total} ms (models ${res.ms} ms). ${res.toReview.length} word(s) to check.`);
  };

  const start = async () => {
    try {
      const rec = await startRecording();
      setRecording(rec);
      setStatus("Recording… (stops at 60 s)");
      timer.current = setTimeout(() => void stop(rec), 60_000);
    } catch (e) {
      setStatus(`Microphone: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const stop = async (rec = recording) => {
    if (!rec) return;
    if (timer.current) clearTimeout(timer.current);
    setRecording(null);
    const { audio, seconds: secs } = await rec.stop();
    setSeconds(Math.round(secs));
    await send(audio, secs);
  };

  const finish = () => {
    if (!heard) return;
    // Exactly what the reading check screen would show: assess, then the result builder.
    const assessment = assessHeard({ passage: words, heard, flipped, seconds, grade: passage.grade, date: new Date() });
    setResult(readingView("Mia", assessment));
  };

  return (
    <main style={{ fontFamily: "monospace", padding: 16, maxWidth: 900 }}>
      <h1>/dev/speech</h1>
      <p>
        <select value={textId} onChange={(e) => { setTextId(e.target.value); setHeard(null); setResult(null); }}>
          {PASSAGES.map((p) => (
            <option key={p.id} value={p.id}>grade {p.grade}: {p.title}</option>
          ))}
        </select>
      </p>
      <p>
        {recording ? <button onClick={() => void stop()}>Stop</button> : <button onClick={() => void start()}>Record</button>}{" "}
        or upload a recording:{" "}
        <input type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f, seconds); }} />{" "}
        seconds read: <input type="number" min={1} max={60} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} style={{ width: 50 }} />
      </p>
      <p>{status}</p>

      <p style={{ lineHeight: 2, fontSize: 18 }}>
        {words.map((w, i) => {
          const h = heard?.words[i];
          const s = h?.status ?? "unreached";
          const tapped = flipped.has(i);
          return (
            <span
              key={i}
              title={h?.heard || h?.heardSecond ? `wav2vec2: ${h?.heard ?? "✓"} · whisper: ${h?.heardSecond ?? "✓"}` : undefined}
              onClick={() => heard && i <= heard.lastAttempted && setFlipped((f) => { const n = new Set(f); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
              style={{ color: COLORS[s], textDecoration: tapped ? "line-through" : undefined, fontWeight: s === "check" ? "bold" : undefined, cursor: "pointer" }}
            >
              {w.display}{" "}
            </span>
          );
        })}
      </p>
      {heard && <p>Green = both heard it right, red = both heard a mistake, <b style={{ color: COLORS.check }}>orange = they disagree</b> (tap to mark as a mistake). Tap any word to flip it.</p>}
      {heard && <button onClick={finish}>See result</button>}
      {result && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify({ score: result.score, unit: result.unit, accuracy: Math.round(result.accuracy * 1000) / 10, verdict: result.verdict, headline: result.headline, noticed: result.noticed.map((n) => n.title) }, null, 2)}
        </pre>
      )}
    </main>
  );
}
