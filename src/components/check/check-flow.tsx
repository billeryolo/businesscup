"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { savePending } from "@/lib/pending";
import type { SpokenWord } from "@/lib/reading/align";
import { assess } from "@/lib/reading/assess";
import type { Grade } from "@/lib/reading/norms";
import { passageById, passageFor, passageWords, pickPassage } from "@/lib/reading/passages";
import { type ReadingRecord, toRecord } from "@/lib/reading/record";
import { type ParentSummary, rulesSummary, summaryFacts } from "@/lib/reading/summary";
import { ChildLimitError, saveReading, updateReadingSummary } from "@/lib/save";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "@/components/ui";
import { AboutStep } from "./about-step";
import { type Plan, PaywallStep } from "./paywall-step";
import { PlanStep } from "./plan-step";
import { type ReadingDone, type ReadingMode, ReadingStep } from "./reading-step";
import { ResultStep } from "./result-step";
import { ReviewStep } from "./review-step";
import type { SaveState } from "./save-progress";
import { SetupStep } from "./setup-step";

type Step = "loading" | "about" | "setup" | "reading" | "review" | "result" | "paywall" | "plan";

const STEP_NUMBER: Partial<Record<Step, number>> = { about: 1, setup: 2, reading: 3, review: 3, result: 4 };

export function CheckFlow() {
  const childParam = useSearchParams().get("child");
  const [step, setStep] = useState<Step>(childParam && isSupabaseConfigured ? "loading" : "about");
  const [childName, setChildName] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [passageId, setPassageId] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>("live");
  const [attempt, setAttempt] = useState(0);
  const [reading, setReading] = useState<{ spoken: SpokenWord[]; seconds: number; date: Date } | null>(null);
  const [marks, setMarks] = useState<Set<number>>(() => new Set());
  const [summary, setSummary] = useState<ParentSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [interestPlan, setInterestPlan] = useState<Plan | null>(null);

  // The saved reading and its latest summary, which can arrive in either order.
  const savedReadingId = useRef<string | null>(null);
  const latestSummary = useRef<ParentSummary | null>(null);
  const pendingBase = useRef<{ childName: string; childId: string | null; record: ReadingRecord } | null>(null);

  // Who is signed in, and for a weekly re-check (?child=…), which child and which new passage.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!childParam) return;
      if (!id) {
        setStep("about");
        return;
      }
      const [{ data: child }, { data: history }] = await Promise.all([
        supabase.from("children").select("id, first_name, grade").eq("id", childParam).maybeSingle(),
        supabase.from("readings").select("passage_id").eq("child_id", childParam).order("read_at", { ascending: false }),
      ]);
      if (!child) {
        setStep("about");
        return;
      }
      const g = child.grade as Grade;
      setChildName(child.first_name);
      setGrade(g);
      setChildId(child.id);
      setPassageId(pickPassage(g, (history ?? []).map((r) => r.passage_id)).id);
      setStep("setup");
    });
  }, [childParam]);

  const passage = (passageId ? passageById(passageId) : undefined) ?? (grade ? passageFor(grade) : null);
  const words = useMemo(() => (passage ? passageWords(passage) : []), [passage]);

  const assessment = useMemo(() => {
    if (!grade || !reading) return null;
    return assess({ passage: words, spoken: reading.spoken, seconds: reading.seconds, grade, date: reading.date, parentMarks: marks });
  }, [grade, reading, words, marks]);

  function startReading(chosen: ReadingMode) {
    setMode(chosen);
    setAttempt((a) => a + 1);
    setStep("reading");
  }

  function finishReading(done: ReadingDone) {
    setReading({ spoken: done.spoken, seconds: done.seconds, date: new Date() });
    setMarks(done.marks);
    setStep("review");
  }

  function onSummary(s: ParentSummary) {
    latestSummary.current = s;
    setSummary(s);
    if (savedReadingId.current) void updateReadingSummary(createClient(), savedReadingId.current, s);
    else if (!userId && pendingBase.current) savePending({ ...pendingBase.current, summary: s });
  }

  function showResult() {
    if (!assessment || !passage || !reading) return;
    const facts = summaryFacts(childName, assessment);
    const record = toRecord(assessment, passage.id, mode, reading.date);
    savedReadingId.current = null;
    latestSummary.current = null;
    pendingBase.current = null;
    setSummary(null);
    setStep("result");

    if (isSupabaseConfigured && userId && mode !== "demo") {
      setSaveState("saving");
      saveReading(createClient(), { childId, childName, record, summary: null })
        .then(({ childId: savedChild, readingId }) => {
          setChildId(savedChild);
          savedReadingId.current = readingId;
          if (latestSummary.current) void updateReadingSummary(createClient(), readingId, latestSummary.current);
          setSaveState("saved");
        })
        .catch((error) => setSaveState(error instanceof ChildLimitError ? "limit" : "error"));
    } else if (isSupabaseConfigured && mode !== "demo") {
      // Not signed in: keep the result on this device so it can be saved after sign-in.
      pendingBase.current = { childName, childId, record };
      savePending({ ...pendingBase.current, summary: null });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    fetch("/api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(facts), signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<ParentSummary>) : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(onSummary)
      .catch(() => onSummary(rulesSummary(facts)))
      .finally(() => clearTimeout(timeout));
  }

  function startTrial(plan: Plan) {
    setInterestPlan(plan);
    setStep("plan");
    void fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, grade, verdict: assessment?.verdict ?? null }),
      keepalive: true,
    }).catch(() => {});
  }

  function toggleMark(i: number) {
    setMarks((m) => {
      const next = new Set(m);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function restart() {
    setReading(null);
    setMarks(new Set());
    setSummary(null);
    setSaveState("idle");
    setPassageId(null);
    setChildId(null);
    setStep("about");
  }

  const stepNumber = STEP_NUMBER[step];
  // Demo recordings are never saved, so there is nothing to sign in for.
  const account = { configured: isSupabaseConfigured && mode !== "demo", signedIn: Boolean(userId), saveState };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16">
      <header className="flex items-center justify-between gap-4 py-5">
        <Logo />
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          {stepNumber ? <p>Step {stepNumber} of 4</p> : null}
          {userId ? (
            <Link href="/dashboard" className="font-semibold text-ink underline-offset-4 hover:underline">
              My children
            </Link>
          ) : null}
        </div>
      </header>

      {step === "loading" ? <div className="h-48 animate-pulse rounded-2xl bg-line" aria-label="Loading" /> : null}

      {step === "about" ? (
        <AboutStep
          childName={childName}
          grade={grade}
          onChange={(name, g) => {
            setChildName(name);
            setGrade(g);
            setPassageId(null);
            setChildId(null);
          }}
          onNext={() => setStep("setup")}
        />
      ) : null}

      {step === "setup" ? <SetupStep childName={childName} onStart={startReading} onBack={() => setStep("about")} /> : null}

      {step === "reading" && passage ? (
        <ReadingStep key={`${attempt}-${mode}`} passage={words} title={passage.title} childName={childName} mode={mode} onDone={finishReading} onSwitchMode={startReading} />
      ) : null}

      {step === "review" && assessment ? (
        <ReviewStep passage={words} assessment={assessment} onTap={toggleMark} onRetry={() => startReading(mode)} onNext={showResult} />
      ) : null}

      {step === "result" && assessment ? (
        <ResultStep childName={childName} assessment={assessment} summary={summary} account={account} onUnlock={() => setStep("paywall")} onRetry={restart} />
      ) : null}

      {step === "paywall" ? <PaywallStep childName={childName} onStart={startTrial} onBack={() => setStep("result")} /> : null}

      {step === "plan" ? (
        summary ? (
          <PlanStep childName={childName} childId={childId} grade={grade} passageId={passage?.id ?? null} summary={summary} interestPlan={interestPlan} account={account} onRestart={restart} />
        ) : (
          <p className="text-ink-soft">Preparing the plan…</p>
        )
      ) : null}
    </div>
  );
}
