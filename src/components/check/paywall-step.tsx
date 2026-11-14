"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

const PLANS = [
  { id: "yearly", title: "Yearly", price: "$99 a year", note: "7 days free, then about $1.90 a week", badge: "Best value" },
  { id: "monthly", title: "Monthly", price: "$14.99 a month", note: "7 days free, cancel anytime", badge: null },
] as const;

export type Plan = (typeof PLANS)[number]["id"];

type Props = { childName: string; onStart: (plan: Plan) => void; onBack: () => void };

export function PaywallStep({ childName, onStart, onBack }: Props) {
  const [plan, setPlan] = useState<Plan>("yearly");
  const name = childName.trim() || "your child";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help {name} read with confidence, 10 minutes a day</h1>
        <p className="mt-2 text-ink-soft">Less than two hours of tutoring for a whole year of practice and progress checks.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {[
          `A daily 10-minute routine matched to ${name}'s mistakes`,
          "A one-minute re-check every week, with a progress chart against the norms",
          "A report to share with the teacher",
          "Up to 3 children",
        ].map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span aria-hidden className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-good text-xs text-white">
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div role="radiogroup" aria-label="Plan" className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={plan === p.id}
            onClick={() => setPlan(p.id)}
            className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-5 text-left transition-colors ${plan === p.id ? "border-brand bg-brand-soft" : "border-line bg-sheet hover:border-ink-faint"}`}
          >
            <span className="flex w-full items-center justify-between">
              <span className="font-semibold">{p.title}</span>
              {p.badge ? <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold">{p.badge}</span> : null}
            </span>
            <span className="text-2xl font-bold">{p.price}</span>
            <span className="text-sm text-ink-soft">{p.note}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={() => onStart(plan)}>Start the 7-day free trial</Button>
        <p className="text-sm text-ink-soft">No card needed today.</p>
      </div>

      <div>
        <Button variant="quiet" onClick={onBack}>
          Back to the result
        </Button>
      </div>
    </div>
  );
}
