"use client";

// First launch: say hello, add a child, run a 1-minute check, show the result. No account. The
// same flow adds another child later, minus the hello screen.

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { BigButton, StepHeader } from "@/components/onboarding/bits";
import { CheckFlow } from "@/components/onboarding/check-flow";
import { ChildForm } from "@/components/onboarding/child-form";
import { ANIMALS, familyActions, MAX_KIDS, useFamily } from "@/lib/store/family";

type Step = "hello" | "child" | "check";

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
              <AvatarBubble animal={animal} size={row === 0 ? 84 : 76} mood={i === 1 ? "cheer" : i % 2 ? "idle" : "happy"} />
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

export default function WelcomePage() {
  const router = useRouter();
  const { ready, kids } = useFamily();
  const [chosen, setChosen] = useState<Step | null>(null);
  const [kidId, setKidId] = useState<string | null>(null);

  const kid = kids.find((k) => k.id === kidId) ?? null;
  const step: Step = chosen ?? (kids.length ? "child" : "hello");
  // Adding a second child starts at the form, so there is no hello screen to go back to.
  const firstChild = kids.length === (kid ? 1 : 0);
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
        <StepHeader onBack={firstChild ? () => setChosen("hello") : () => router.push("/home")} at={0} />
        <h1 className="pb-5 text-[26px] font-semibold leading-tight">Who is learning?</h1>
        <ChildForm
          initial={kid ?? undefined}
          onSubmit={(draft) => {
            if (kid) familyActions.updateKid(kid.id, draft);
            else setKidId(familyActions.addKid(draft)?.id ?? null);
            setChosen("check");
          }}
        />
      </>
    );
  } else if (kid) {
    screen = <CheckFlow kid={kid} exitLabel="Skip the check" onExit={() => router.push("/home")} onBack={() => setChosen("child")} dots />;
  }

  return (
    <div className="min-h-dvh flex-1 bg-lilac font-app text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip bg-mist px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] shadow-[0_0_60px_rgba(27,20,51,0.18)]">
        {ready ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} className="flex flex-1 flex-col" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.22, ease: "easeOut" }}>
              {screen}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-[330px] animate-pulse rounded-[28px] bg-lilac-soft" />
        )}
      </div>
    </div>
  );
}
