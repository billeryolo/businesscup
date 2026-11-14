"use client";

// Pick a 1-minute check, do it, see the result. Used at the end of onboarding and for every
// later re-check from Home.

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { Icon, type IconName } from "@/components/icons";
import { checksFor } from "@/lib/checks/quick";
import { quickView, readingView, type ResultView } from "@/lib/checks/result";
import type { Grade as ReadingGrade } from "@/lib/reading/norms";
import { passageFor, passageWords } from "@/lib/reading/passages";
import { checkActions, type CheckKind } from "@/lib/store/checks";
import type { Kid } from "@/lib/store/family";
import { BigButton, StepHeader } from "./bits";
import { QuickCheck } from "./quick-check";
import { ReadingCheck } from "./reading-check";
import { ResultScreen } from "./result";

const CHECKS: Record<CheckKind, { title: string; body: string; icon: IconName; tone: string }> = {
  reading: { title: "Reading", body: "Reads a short story out loud. We count words read correctly.", icon: "book", tone: "bg-lilac" },
  math: { title: "Math", body: "Answers as many quick facts as they can.", icon: "plus", tone: "bg-peach/70" },
  letters: { title: "Letters", body: "Names the letters that pop up.", icon: "letters", tone: "bg-mint" },
};

function Pick({ kid, exitLabel, onPick, onExit }: { kid: Kid; exitLabel: string; onPick: (kind: CheckKind) => void; onExit: () => void }) {
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
              <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/70">
                <Icon name={c.icon} size={34} />
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
        <BigButton tone="ghost" onClick={onExit}>
          {exitLabel}
        </BigButton>
      </div>
    </div>
  );
}

type Props = {
  kid: Kid;
  /** Leaving without a check: "Skip the check" in onboarding, "Not now" from Home. */
  exitLabel: string;
  onExit: () => void;
  /** Back from the picker; without it the picker has no back button. */
  onBack?: () => void;
  /** Show the onboarding progress dots. */
  dots?: boolean;
};

export function CheckFlow({ kid, exitLabel, onExit, onBack, dots }: Props) {
  const [step, setStep] = useState<"pick" | CheckKind | "result">("pick");
  const [view, setView] = useState<ResultView | null>(null);
  const passage = useMemo(() => (kid.grade >= 1 ? passageFor(kid.grade as ReadingGrade) : null), [kid.grade]);
  const words = useMemo(() => (passage ? passageWords(passage) : []), [passage]);

  function finish(kind: CheckKind, result: ResultView) {
    checkActions.add({ kidId: kid.id, kind, at: new Date().toISOString(), score: result.score, accuracy: result.accuracy, target: result.target, verdict: result.verdict });
    setView(result);
    setStep("result");
    window.scrollTo({ top: 0 });
  }

  let screen: React.ReactNode = null;
  if (step === "pick") screen = <Pick kid={kid} exitLabel={exitLabel} onPick={setStep} onExit={onExit} />;
  else if (step === "reading" && passage) screen = <ReadingCheck passage={words} title={passage.title} kidName={kid.name} grade={kid.grade as ReadingGrade} onResult={(a) => finish("reading", readingView(kid.name, a))} />;
  else if (step === "math" || step === "letters") screen = <QuickCheck key={step} kind={step} kid={kid} onResult={(r) => finish(step, quickView(kid.name, kid.grade, r))} />;
  else if (step === "result" && view) screen = <ResultScreen kid={kid} view={view} onRetry={() => setStep("pick")} />;

  const back = step === "pick" ? onBack : step === "result" ? undefined : () => setStep("pick");

  return (
    <div className="flex flex-1 flex-col">
      {step !== "result" && (back || dots) ? <StepHeader onBack={back} at={dots ? (step === "pick" ? 1 : 2) : undefined} /> : null}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} className="flex flex-1 flex-col" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.22, ease: "easeOut" }}>
          {screen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
