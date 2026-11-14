"use client";

import { Icon } from "@/components/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Grade } from "@/lib/reading/norms";
import { type Passage, passageById, passageWords, practicePassagesFor } from "@/lib/reading/passages";
import { readConsent, saveConsent } from "@/lib/pending";
import { useSpeechRecognition, useSpeechSupported } from "@/lib/speech/use-speech-recognition";
import { PassageView } from "@/components/check/passage-view";
import { Button } from "@/components/ui";
import { ORDINAL } from "@/components/verdict";
import { BigWord } from "./big-word";
import { usePracticePosition } from "./use-practice-position";

type View = "word" | "story";
type Step = "setup" | "reading" | "done";

const GRADES: Grade[] = [1, 2, 3, 4];

function gradeParam(value: string | null): Grade | null {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

export function PracticeFlow() {
  const params = useSearchParams();
  // A story from a check can be practiced again (repeated reading); new practice stories are
  // separate from the check stories, so practice never spoils a future check.
  const fromCheck = passageById(params.get("story") ?? "");
  const [grade, setGrade] = useState<Grade>(gradeParam(params.get("grade")) ?? fromCheck?.grade ?? 1);
  const choices = useMemo(() => {
    const list = practicePassagesFor(grade);
    return fromCheck && fromCheck.grade === grade && !list.includes(fromCheck) ? [fromCheck, ...list] : list;
  }, [grade, fromCheck]);
  const [storyId, setStoryId] = useState<string>(choices[0].id);
  const story: Passage = choices.find((p) => p.id === storyId) ?? choices[0];
  const [view, setView] = useState<View>(grade <= 2 ? "word" : "story");
  const [syllables, setSyllables] = useState(true);
  const [listen, setListen] = useState(false);
  const [step, setStep] = useState<Step>("setup");

  const supported = useSpeechSupported();
  const speech = useSpeechRecognition();
  const listening = step === "reading" && listen && !speech.error;
  const words = useMemo(() => passageWords(story), [story]);
  // Words heard stay in place after a microphone error, so the position doesn't jump back.
  const { position, goTo, reset } = usePracticePosition(words, step === "reading" && listen ? speech.words : null);
  const finished = step === "reading" && position >= words.length;

  function pickGrade(g: Grade) {
    setGrade(g);
    const list = practicePassagesFor(g);
    setStoryId((fromCheck?.grade === g ? fromCheck : list[0]).id);
    setView(g <= 2 ? "word" : "story");
  }

  function start(nextView: View = view) {
    setView(nextView);
    reset();
    if (listen) {
      saveConsent();
      speech.start();
    }
    setStep("reading");
  }

  const stop = speech.stop;
  const exit = useCallback(() => {
    stop();
    setStep("setup");
  }, [stop]);

  useEffect(() => {
    if (finished) stop();
  }, [finished, stop]);

  const go = useCallback((p: number) => goTo(p), [goTo]);

  if (step === "reading" && finished) {
    return (
      <div className="flex flex-col items-start gap-5">
        <Icon name="star" size={56} />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The whole story, read!</h1>
        <p className="text-lg text-ink-soft">
          {story.title}: {words.length} words. Reading the same story again tomorrow is one of the best ways to build speed.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={() => start()}>Read it again</Button>
          <Button variant="secondary" onClick={() => start(view === "word" ? "story" : "word")}>
            {view === "word" ? "Read the whole story" : "One word at a time"}
          </Button>
          <Button variant="secondary" onClick={exit}>
            Choose another story
          </Button>
        </div>
      </div>
    );
  }

  if (step === "reading") {
    const micProblem =
      listen && speech.error ? (
        <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm">
          {speech.error === "microphone" ? "The microphone is blocked, so tap to go on." : "Listening stopped working, so tap to go on."}
        </p>
      ) : null;

    if (view === "word") {
      return (
        <BigWord
          notice={micProblem}
          passage={words}
          position={position}
          syllables={syllables}
          listening={listening}
          onGo={go}
          onToggleSyllables={() => setSyllables((s) => !s)}
          onExit={exit}
        />
      );
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b-2 border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border-2">
          <Button variant="quiet" onClick={exit} className="px-2">
            Done
          </Button>
          {listening ? (
            <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-bad" aria-hidden="true" /> Listening
            </span>
          ) : (
            <span className="text-sm text-ink-soft">Tap a word to move the marker</span>
          )}
          <button
            type="button"
            onClick={() => setSyllables((s) => !s)}
            aria-pressed={syllables}
            className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold ${syllables ? "border-brand bg-brand-soft text-brand-deep" : "border-line text-ink-soft"}`}
          >
            syl·la·bles
          </button>
        </div>
        {micProblem}
        <div className="rounded-2xl border-2 border-line bg-sheet p-5 sm:p-8">
          <h1 className="mb-4 font-read text-2xl font-semibold">{story.title}</h1>
          <PassageView passage={words} lastAttempted={position - 1} mode="reading" onTap={(i) => goTo(i)} syllables={syllables} />
        </div>
        <Button variant="secondary" onClick={() => goTo(words.length)} className="self-start">
          I finished the story
        </Button>
      </div>
    );
  }

  const consentGiven = readConsent() !== null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Practice reading</h1>
        <p className="mt-2 text-ink-soft">
          Big words and syllables make reading easier while a child is learning. Practice isn&apos;t scored and nothing is saved. For a result you can compare
          with the norms, use the{" "}
          <Link href="/check" className="font-semibold text-ink underline underline-offset-4">
            one-minute check
          </Link>
          .
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Grade</legend>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => pickGrade(g)}
              aria-pressed={grade === g}
              className={`min-h-12 rounded-xl border-2 px-4 font-semibold ${grade === g ? "border-brand bg-brand-soft text-brand-deep" : "border-line bg-sheet"}`}
            >
              {ORDINAL[g]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Story</legend>
        {choices.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 ${p.id === story.id ? "border-brand bg-brand-soft" : "border-line bg-sheet"}`}
          >
            <input type="radio" name="story" className="h-5 w-5 accent-brand" checked={p.id === story.id} onChange={() => setStoryId(p.id)} />
            <span>
              <span className="font-semibold">{p.title}</span>
              {p === fromCheck ? <span className="block text-sm text-ink-soft">The story from the check: reading it again builds speed</span> : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">How to show it</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "word",
                title: "One big word at a time",
                body: "Each word fills the screen, so there is only one thing to look at. Best for younger readers.",
              },
              {
                id: "story",
                title: "The whole story",
                body: "A yellow marker shows where you are. Tap a word to move it.",
              },
            ] as const
          ).map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${view === o.id ? "border-brand bg-brand-soft" : "border-line bg-sheet"}`}
            >
              <input type="radio" name="view" className="mt-1 h-5 w-5 shrink-0 accent-brand" checked={view === o.id} onChange={() => setView(o.id)} />
              <span>
                <span className="block font-semibold">{o.title}</span>
                <span className="mt-1 block text-sm text-ink-soft">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand" checked={syllables} onChange={(e) => setSyllables(e.target.checked)} />
          <span>
            Split words into syllables:{" "}
            <span className="font-read">
              sun·<span className="text-brand-deep">flow</span>·ers
            </span>
          </span>
        </label>
        {supported ? (
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand" checked={listen} onChange={(e) => setListen(e.target.checked)} />
            <span>
              Move on by itself when a word is read out loud (uses the microphone).
              {!consentGiven ? (
                <span className="mt-1 block text-sm text-ink-soft">
                  By turning this on, you, the parent or guardian, agree that the reading is sent to this browser&apos;s speech service to turn it into words.
                  ReadBuddy never stores the audio.{" "}
                  <Link href="/privacy" target="_blank" className="font-semibold underline underline-offset-4">
                    Privacy policy
                  </Link>
                </span>
              ) : null}
            </span>
          </label>
        ) : null}
      </div>

      <div>
        <Button onClick={() => start()}>Start reading</Button>
      </div>
    </div>
  );
}
