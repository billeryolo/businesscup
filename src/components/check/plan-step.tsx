"use client";

import type { ParentSummary } from "@/lib/reading/summary";
import { PlanView } from "@/components/plan-view";
import { ReminderButton } from "@/components/reminder-button";
import type { Grade } from "@/lib/reading/norms";
import { Button, LinkButton } from "@/components/ui";
import type { Plan } from "./paywall-step";
import { type AccountState, SaveProgress } from "./save-progress";

type Props = {
  childName: string;
  /** The saved child, so the reminder link starts a re-check for them. */
  childId: string | null;
  grade: Grade | null;
  /** The story just read, to practice again. */
  passageId: string | null;
  summary: ParentSummary;
  interestPlan: Plan | null;
  account: AccountState;
  onRestart: () => void;
};

export function PlanStep({ childName, childId, grade, passageId, summary, interestPlan, account, onRestart }: Props) {
  const name = childName.trim() || "your child";

  return (
    <div className="flex flex-col gap-6">
      {interestPlan ? (
        <p role="status" className="rounded-xl bg-sun-soft px-4 py-3">
          ReadCheck is in beta, so the plan is free for now. We&apos;ve noted that you&apos;d like the {interestPlan} plan; nothing has been charged.
        </p>
      ) : null}

      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name[0].toUpperCase() + name.slice(1)}&apos;s 4-week plan</h1>
        <p className="mt-2 text-ink-soft">Ten minutes a day. Do the re-check at the end of week 4 to see the change.</p>
      </div>

      <SaveProgress account={account} childName={childName} />

      <PlanView summary={summary} />

      <div className="flex flex-col gap-3 rounded-2xl border-2 border-line bg-sheet p-5">
        <h2 className="text-lg font-bold">Practice with the same story</h2>
        <p className="text-ink-soft">
          Reading a story again is one of the best ways to build speed. Practice mode shows one big word at a time, or words split into syllables.
        </p>
        <LinkButton href={`/practice?${new URLSearchParams({ ...(grade ? { grade: String(grade) } : {}), ...(passageId ? { story: passageId } : {}) })}`} variant="secondary" className="self-start">
          Open practice mode
        </LinkButton>
      </div>

      <ReminderButton childName={childName} childId={childId} />

      <div>
        <Button variant="quiet" onClick={onRestart}>
          Start a new check
        </Button>
      </div>
    </div>
  );
}
