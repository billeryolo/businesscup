"use client";

// The result of a 1-minute check: the number, where it sits among other children, what it means,
// and a 4-week plan. The child's friend celebrates whatever the score is: finishing counts.

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { type ResultView, VERDICT_LABEL } from "@/lib/checks/result";
import type { Kid } from "@/lib/store/family";
import { BigButton, Confetti, CountUp } from "./bits";

const VERDICT_TONE = { onTrack: "bg-mint", practice: "bg-peach", talkToTeacher: "bg-candy" } as const;
const ZONE_TONE = { low: "bg-candy/70", mid: "bg-peach/70", good: "bg-mint" } as const;

function PeerBar({ view, name }: { view: ResultView; name: string }) {
  const { max, zones, ticks, source } = view.bar;
  const pct = (v: number) => Math.min(100, (Math.min(v, max) / max) * 100);
  // On a phone two labels closer than an eighth of the bar collide: the main one wins.
  const main = ticks.find((t) => t.label === "typical" || t.label === "goal");
  const shown = ticks.filter((t) => t === main || !main || Math.abs(pct(t.at) - pct(main.at)) >= 12.5);
  return (
    <div>
      <div className="relative mt-10 pb-10">
        <div className="flex h-4 overflow-hidden rounded-full">
          {zones.map((zone, i) => {
            const width = pct(zone.to) - pct(zones[i - 1]?.to ?? 0);
            return <div key={zone.tone} className={ZONE_TONE[zone.tone]} style={{ width: `${width}%` }} />;
          })}
        </div>
        {shown.map((tick) => (
          <div key={tick.label} className="absolute top-4 -translate-x-1/2 text-center text-[11px] leading-tight text-night-soft" style={{ left: `${pct(tick.at)}%` }}>
            <div className="mx-auto h-2 w-px bg-night/30" />
            <span className={tick.label === "typical" || tick.label === "goal" ? "font-semibold text-night" : ""}>
              {tick.label}
              <br />
              {tick.at}
            </span>
          </div>
        ))}
        <motion.div
          className="absolute bottom-14 -translate-x-1/2"
          initial={{ left: "0%" }}
          animate={{ left: `${pct(view.score)}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.4 }}
        >
          <span className="block whitespace-nowrap rounded-full bg-night px-2.5 py-1 text-xs font-semibold text-white">
            {name}: {view.score}
          </span>
          <div className="mx-auto h-2 w-0.5 bg-night" />
        </motion.div>
      </div>
      <p className="text-xs leading-snug text-night-soft">{source}</p>
    </div>
  );
}

function Card({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]"
    >
      <h2 className="text-xs font-semibold uppercase tracking-widest text-night-soft">{title}</h2>
      {children}
    </motion.section>
  );
}

export function ResultScreen({ kid, view, onRetry }: { kid: Kid; view: ResultView; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyNote() {
    try {
      await navigator.clipboard.writeText(view.teacherNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: the note stays on screen to copy by hand.
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="relative -mx-5 -mt-5 overflow-hidden rounded-b-[40px] bg-sky px-5 pb-7 pt-[max(28px,env(safe-area-inset-top))] text-center">
        <div className="cloud-drift absolute left-6 top-8 h-8 w-20 rounded-full bg-white/70" aria-hidden="true" />
        <div className="cloud-drift absolute right-4 top-20 h-6 w-16 rounded-full bg-white/60" aria-hidden="true" />
        <div className="relative mx-auto w-fit">
          <Confetti />
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 13 }}>
            <AvatarBubble animal={kid.avatar} size={104} mood="cheer" />
          </motion.div>
        </div>
        <p className="mt-3 font-kid text-xl font-semibold">Well done, {kid.name}!</p>
        <CountUp value={view.score} className="mt-1 block font-kid text-[84px] font-semibold leading-none tabular-nums" />
        <p className="mt-1 text-sm font-medium text-night/70">{view.unit}</p>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 16, delay: 1.3 }}
          className={`mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold ${VERDICT_TONE[view.verdict]}`}
        >
          {VERDICT_LABEL[view.verdict]}
        </motion.span>
      </div>

      <Card title={view.kind === "reading" ? "Among other children" : "Against the goal"} delay={0.2}>
        <PeerBar view={view} name={kid.name} />
        <p className="mt-4 text-lg font-semibold leading-snug">{view.headline}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-night-soft">{view.meaning}</p>
      </Card>

      <Card title="What we noticed" delay={0.3}>
        <ul className="mt-3 grid gap-4">
          {view.noticed.map((n) => (
            <li key={n.title}>
              <p className="font-semibold">{n.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-night-soft">{n.why}</p>
              <p className="mt-2 rounded-2xl bg-lilac-soft px-4 py-3 text-[15px] leading-snug">
                <span className="font-semibold">Tonight: </span>
                {n.tonight}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="4-week plan" delay={0.4}>
        <ol className="mt-3 grid gap-3">
          {view.plan.map((week) => (
            <li key={week.week} className="flex gap-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-night text-sm font-semibold text-white">{week.week}</span>
              <div>
                <p className="font-semibold leading-snug">{week.goal}</p>
                <p className="mt-0.5 text-sm leading-snug text-night-soft">{week.daily}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Note for the teacher" delay={0.5}>
        <p className="mt-3 text-[15px] leading-relaxed text-night-soft">{view.teacherNote}</p>
        <button type="button" onClick={copyNote} className="mt-3 min-h-11 rounded-full bg-lilac-soft px-5 text-sm font-semibold" aria-live="polite">
          {copied ? "Copied ✓" : "Copy note for teacher"}
        </button>
      </Card>

      <div className="sticky bottom-0 -mx-5 grid gap-2 bg-gradient-to-t from-mist from-80% to-transparent px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6">
        <Link href="/home" className="grid min-h-14 place-items-center rounded-full bg-night px-6 text-base font-semibold text-white shadow-[0_10px_24px_rgba(27,20,51,0.28)]">
          Start my plan
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/assistant" className="grid min-h-12 place-items-center rounded-full bg-white px-4 text-sm font-semibold shadow-[0_6px_18px_rgba(27,20,51,0.10)]">
            Ask the assistant
          </Link>
          <BigButton tone="light" onClick={onRetry} className="!min-h-12 !text-sm">
            Try again
          </BigButton>
        </div>
      </div>
    </div>
  );
}
