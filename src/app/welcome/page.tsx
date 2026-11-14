"use client";

// First launch: say hello, add a child, run a 1-minute check, show the result. No account. The
// same flow adds another child later, minus the hello screen.

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { BackButton, BigButton } from "@/components/onboarding/bits";
import { ChildForm } from "@/components/onboarding/child-form";
import { QuickCheck } from "@/components/onboarding/quick-check";
import { ReadingCheck } from "@/components/onboarding/reading-check";
import { ResultScreen } from "@/components/onboarding/result";
import { checksFor } from "@/lib/checks/quick";
import { quickView, readingView, type ResultView } from "@/lib/checks/result";
import type { Grade as ReadingGrade } from "@/lib/reading/norms";
import { passageFor, passageWords } from "@/lib/reading/passages";
import { checkActions, type CheckKind } from "@/lib/store/checks";
import { ANIMALS, familyActions, type Kid, MAX_KIDS, useFamily } from "@/lib/store/family";

type Step = "hello" | "child" | "pick" | CheckKind | "result";

const CHECKS: Record<CheckKind, { title: string; body: string; emoji: string; tone: string }> = {
  reading: { title: "Reading", body: "Reads a short story out loud. We count words read correctly.", emoji: "📖", tone: "bg-lilac" },
  math: { title: "Math", body: "Answers as many quick facts as they can.", emoji: "➕", tone: "bg-peach/70" },
  letters: { title: "Letters", body: "Names the letters that pop up.", emoji: "🔤", tone: "bg-mint" },
};

function Hello({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="relative -mx-5 -mt-5 h-[330px] overflow-hidden rounded-b-[44px] bg-sky">
        <div className="cloud-drift absolute left-5 top-12 h-9 w-24 rounded-full bg-white/80" aria-hidden="true" />
        <div className="cloud-drift absolute right-6 top-28 h-7 w-20 rounded-full bg-white/70" aria-hidden="true" />
        <div className="cloud-drift absolute bottom-10 left-16 h-8 w-28 rounded-full bg-white/60" aria-hidden="true" />
        {ANIMALS.map((animal, i) => {
          // Two rows of three, the middle one of each row a little higher.
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <motion.div
              key={animal}
              className="absolute"
              style={{ left: `${12 + col * 29 + row * 4}%`, top: 62 + row * 122 - (col === 1 ? 18 : 0) }}
              initial={{ scale: 0, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.15 + i * 0.09 }}
            >
              <AvatarBubble animal={animal} size={row === 0 ? 84 : 76} mood={i === 1 ? "cheer" : i === 2 ? "wave" : i % 2 ? "idle" : "happy"} />
            </motion.div>
          );
        })}
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-7">
        <h1 className="text-[30px] font-semibold leading-[1.15] tracking-tight">Help your child read and count</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-night-soft">A 1-minute check shows where they are for their grade. Then a few playful minutes a day. No account needed: everything stays on this phone.</p>
      </motion.div>
      <div className="mt-auto grid gap-2 pt-8">
        <BigButton onClick={onStart}>Get started</BigButton>
        <BigButton tone="ghost" onClick={onDemo}>
          Try with a demo family
        </BigButton>
      </div>
    </div>
  );
}

function Pick({ kid, onPick, onSkip }: { kid: Kid; onPick: (kind: CheckKind) => void; onSkip: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-4">
        <AvatarBubble animal={kid.avatar} size={72} mood="happy" />
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">1-minute check</h1>
          <p className="text-sm text-night-soft">Pick one to see where {kid.name} is today.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {checksFor(kid.grade).map((kind, i) => {
          const c = CHECKS[kind];
          return (
            <motion.button
              key={kind}
              type="button"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(kind)}
              className={`flex items-center gap-4 rounded-[28px] p-5 text-left ${c.tone}`}
            >
              <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/70 text-2xl" aria-hidden="true">
                {c.emoji}
              </span>
              <span>
                <span className="block text-lg font-semibold">{c.title}</span>
                <span className="block text-sm leading-snug text-night/70">{c.body}</span>
              </span>
              <span className="ml-auto flex-none rounded-full bg-night px-3 py-1.5 text-xs font-semibold text-white">1 min</span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        <BigButton tone="ghost" onClick={onSkip}>
          Skip the check
        </BigButton>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { ready, kids } = useFamily();
  const [chosen, setChosen] = useState<Step | null>(null);
  const [kidId, setKidId] = useState<string | null>(null);
  const [view, setView] = useState<ResultView | null>(null);

  const kid = kids.find((k) => k.id === kidId) ?? null;
  const step: Step = chosen ?? (kids.length ? "child" : "hello");
  const passage = useMemo(() => (kid && kid.grade >= 1 ? passageFor(kid.grade as ReadingGrade) : null), [kid]);
  const words = useMemo(() => (passage ? passageWords(passage) : []), [passage]);

  function finish(kind: CheckKind, result: ResultView) {
    if (!kid) return;
    checkActions.add({ kidId: kid.id, kind, at: new Date().toISOString(), score: result.score, accuracy: result.accuracy, target: result.target, verdict: result.verdict });
    setView(result);
    setChosen("result");
    window.scrollTo({ top: 0 });
  }

  const back: Partial<Record<Step, Step>> = { child: "hello", pick: "child", reading: "pick", math: "pick", letters: "pick" };
  const canGoBack = back[step] && !(step === "child" && kids.length > (kid ? 1 : 0));
  const full = !kid && kids.length >= MAX_KIDS;

  let screen: React.ReactNode = null;
  if (step === "hello") {
    screen = (
      <Hello
        onStart={() => setChosen("child")}
        onDemo={() => {
          familyActions.loadDemoFamily();
          router.push("/home");
        }}
      />
    );
  } else if (step === "child") {
    screen = full ? (
      <div className="grid gap-4 pt-10 text-center">
        <p className="text-lg font-semibold">You already have {MAX_KIDS} children here.</p>
        <Link href="/home" className="font-semibold underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    ) : (
      <>
        <h1 className="pb-5 text-[26px] font-semibold leading-tight">Who is learning?</h1>
        <ChildForm
          initial={kid ?? undefined}
          onSubmit={(draft) => {
            if (kid) familyActions.updateKid(kid.id, draft);
            else setKidId(familyActions.addKid(draft)?.id ?? null);
            setChosen("pick");
          }}
        />
      </>
    );
  } else if (step === "pick" && kid) {
    screen = <Pick kid={kid} onPick={setChosen} onSkip={() => router.push("/home")} />;
  } else if (step === "reading" && kid && passage) {
    screen = <ReadingCheck passage={words} title={passage.title} kidName={kid.name} grade={kid.grade as ReadingGrade} onResult={(a) => finish("reading", readingView(kid.name, a))} />;
  } else if ((step === "math" || step === "letters") && kid) {
    screen = <QuickCheck key={step} kind={step} kid={kid} onResult={(r) => finish(step, quickView(kid.name, kid.grade, r))} />;
  } else if (step === "result" && kid && view) {
    screen = <ResultScreen kid={kid} view={view} onRetry={() => setChosen("pick")} />;
  }

  return (
    <div className="min-h-dvh flex-1 bg-lilac font-app text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip bg-mist px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] shadow-[0_0_60px_rgba(27,20,51,0.18)]">
        {ready ? (
          <>
            {step !== "hello" && step !== "result" ? (
              <div className="flex h-11 items-center pb-4">
                {canGoBack ? <BackButton onClick={() => setChosen(back[step]!)} /> : null}
                <div className="mx-auto flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((dot) => {
                    const at = step === "child" ? 0 : step === "pick" ? 1 : 2;
                    return <motion.span key={dot} animate={{ width: dot === at ? 26 : 8 }} className={`h-2 rounded-full ${dot <= at ? "bg-night" : "bg-night/15"}`} />;
                  })}
                </div>
                {canGoBack ? <span className="w-11" /> : null}
              </div>
            ) : null}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="flex flex-1 flex-col"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {screen}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <div className="h-[330px] animate-pulse rounded-[28px] bg-lilac-soft" />
        )}
      </div>
    </div>
  );
}
