"use client";

// ReadBuddy Plus: what's free, what you pay for, the price, and a 7-day free trial.
// During the beta nothing is charged; the tap is recorded and remembered on this phone.

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { FREE, PLUS, PRICES, plusActions, type PlusPlan, useTrial } from "@/lib/plus";
import { useChecks } from "@/lib/store/checks";
import { useFamily } from "@/lib/store/family";

const card = "rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";

export default function PlansPage() {
  const { active } = useFamily();
  const checks = useChecks(active?.id);
  const trial = useTrial();
  const [plan, setPlan] = useState<PlusPlan>("yearly");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    await plusActions.startTrial(plan, { grade: active?.grade ?? null, verdict: checks[0]?.verdict ?? null });
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-lilac font-app text-night">
      <div className="mx-auto min-h-dvh max-w-[430px] bg-mist px-5 pb-10 pt-[max(20px,env(safe-area-inset-top))]">
        <Link href="/family" className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold">
          ← Back
        </Link>

        <h1 className="mt-5 text-[28px] font-semibold leading-tight">ReadBuddy Plus</h1>
        <p className="mt-1 text-[15px] text-night-soft">
          From a 1-minute check to real progress{active ? ` for ${active.name}` : ""}: a plan, daily practice and weekly proof it’s working.
        </p>

        {trial ? (
          <div className={`${card} mt-5 bg-mint/60`} role="status">
            <p className="text-lg font-semibold">Your 7 free days have started</p>
            <p className="mt-1 text-[15px]">
              {PRICES[trial.plan].price} {PRICES[trial.plan].per} after the trial. During the beta nothing is charged, and we’ll ask before anything ever is.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Plan">
              {(["yearly", "monthly"] as const).map((p) => (
                <motion.button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={plan === p}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPlan(p)}
                  className={`relative rounded-[24px] p-4 text-left ${plan === p ? "bg-white ring-2 ring-night" : "bg-white/70"}`}
                >
                  {p === "yearly" ? <span className="absolute -top-2.5 right-3 rounded-full bg-peach px-2 py-0.5 text-[11px] font-bold">Best value</span> : null}
                  <span className="block text-sm font-semibold capitalize text-night-soft">{p}</span>
                  <span className="mt-1 block text-[26px] font-semibold leading-none">{PRICES[p].price}</span>
                  <span className="block text-sm text-night-soft">{PRICES[p].per}</span>
                  <span className="mt-2 block text-xs font-semibold">{PRICES[p].note}</span>
                </motion.button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} type="button" disabled={busy} onClick={start} className="mt-4 h-14 w-full rounded-full bg-night text-[17px] font-semibold text-white disabled:opacity-60">
              Start 7 days free
            </motion.button>
            <p className="mt-2 text-center text-xs text-night-soft">Nothing is charged during the beta. Cancel in one tap; we remind you 2 days before a trial ends.</p>
          </>
        )}

        <div className={`${card} mt-5`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">Plus</p>
          <ul className="mt-3 grid gap-2.5">
            {PLUS.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-mint">
                  <Icon name="check" size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${card} mt-3`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">Always free</p>
          <ul className="mt-3 grid gap-2 text-[15px] leading-snug text-night-soft">
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-center text-xs text-night-soft">A private tutor costs far more each month. Plus is one price for the whole family, and your family’s data stays on this phone.</p>
      </div>
    </div>
  );
}
