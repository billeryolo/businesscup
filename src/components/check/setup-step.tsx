"use client";

import Link from "next/link";
import { useState } from "react";
import { saveConsent } from "@/lib/pending";
import { useSpeechSupported } from "@/lib/speech/use-speech-recognition";
import { Button } from "@/components/ui";
import type { ReadingMode } from "./reading-step";

type Props = {
  childName: string;
  onStart: (mode: ReadingMode) => void;
  onBack: () => void;
};

export function SetupStep({ childName, onStart, onBack }: Props) {
  const supported = useSpeechSupported();
  const [consent, setConsent] = useState(false);
  const name = childName.trim() || "your child";

  function startWithMicrophone() {
    saveConsent();
    onStart("live");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Before you start</h1>
        <p className="mt-2 text-ink-soft">This is how teachers run the one-minute reading check, so the result can be compared with the norms.</p>
      </div>

      <ol className="flex flex-col gap-3">
        {[
          "Find a quiet spot and sit next to each other.",
          `${name[0].toUpperCase()}${name.slice(1)} reads the story out loud from the first word, at a normal pace.`,
          "Don't help with words, even tricky ones. Just listen.",
          "The minute starts with the first word and stops by itself.",
        ].map((line, i) => (
          <li key={line} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-deep">{i + 1}</span>
            <span className="pt-0.5">{line}</span>
          </li>
        ))}
      </ol>

      {supported ? (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-line bg-sheet p-5">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I&apos;m {name === "your child" ? "the child" : name}&apos;s parent or guardian. I agree that the reading is sent to this browser&apos;s speech
              service (for example Google in Chrome, Apple in Safari) to turn it into words for scoring. ReadBuddy never stores the audio.{" "}
              <Link href="/privacy" className="font-semibold underline underline-offset-4" target="_blank">
                Privacy policy
              </Link>
            </span>
          </label>
          <Button onClick={startWithMicrophone} disabled={!consent} className="self-start">
            Use the microphone
          </Button>
        </div>
      ) : (
        <p className="rounded-xl bg-warn-soft px-4 py-3">
          This browser can&apos;t listen. Open the page in Chrome, Edge or Safari to use the microphone, or score the reading yourself below.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant={supported ? "secondary" : "primary"} onClick={() => onStart("manual")}>
          Score it myself, no microphone
        </Button>
        <Button variant="secondary" onClick={() => onStart("demo")}>
          Watch a demo recording
        </Button>
      </div>

      <div>
        <Button variant="quiet" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
