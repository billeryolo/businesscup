"use client";

// Progress: is the child growing? One kind of check at a time, drawn against its goal, with the
// list of every check underneath. Everything comes from the checks saved on this phone.

import { motion } from "motion/react";
import Link from "next/link";
import { useId, useState } from "react";
import { Orb } from "@/components/assistant/orb";
import { AvatarBubble } from "@/components/avatars/animal";
import { Icon, type IconName } from "@/components/icons";
import { ScreenHeader, Stagger } from "@/components/app/screen";
import { VERDICT_LABEL } from "@/lib/checks/result";
import { changeText, curve, place, type Trend, trendFor } from "@/lib/progress/trend";
import { type CheckKind, type CheckRecord, useChecks } from "@/lib/store/checks";
import { familyActions, gradeLabel, type Kid, useFamily } from "@/lib/store/family";

const card = "rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";
const KINDS: { kind: CheckKind; label: string; icon: IconName; tone: string; unit: string }[] = [
  { kind: "reading", label: "Reading", icon: "book", tone: "bg-lilac-soft", unit: "words a minute" },
  { kind: "math", label: "Math", icon: "bolt", tone: "bg-peach/60", unit: "facts a minute" },
  { kind: "letters", label: "Letters", icon: "letters", tone: "bg-mint/70", unit: "letters a minute" },
];
const VERDICT_TONE = { onTrack: "bg-mint", practice: "bg-peach/70", talkToTeacher: "bg-candy/60" } as const;
const BOX = { width: 320, height: 170, left: 14, right: 14, top: 16, bottom: 30 };
const day = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });

function Chart({ trend }: { trend: Trend }) {
  const id = useId();
  const { dots, goalY, floor } = place(trend.points.map((p) => p.score), trend.target, BOX);
  const line = curve(dots);
  const last = dots[dots.length - 1];
  const labels = dots.length <= 4 ? dots.map((_, i) => i) : [0, dots.length - 1];
  return (
    <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} className="mt-4 w-full" role="img" aria-label={`Scores: ${trend.points.map((p) => p.score).join(", ")}. Goal ${trend.target}.`}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a88f2" stopOpacity="0.32" />
          <stop offset="1" stopColor="#9a88f2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8fd0ff" />
          <stop offset="0.55" stopColor="#9a88f2" />
          <stop offset="1" stopColor="#f29be3" />
        </linearGradient>
      </defs>
      <line x1={BOX.left} x2={BOX.width - BOX.right} y1={floor} y2={floor} stroke="#1b1433" strokeOpacity="0.08" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={BOX.left} x2={BOX.width - BOX.right} y1={goalY} y2={goalY} stroke="#1b1433" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
      <text x={BOX.width - BOX.right} y={goalY - 6} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#6b6585">
        Goal {trend.target}
      </text>
      {dots.length > 1 && (
        <>
          <motion.path d={`${line} L${last.x} ${floor} L${dots[0].x} ${floor} Z`} fill={`url(#${id}-fill)`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
          <motion.path d={line} fill="none" stroke={`url(#${id}-line)`} strokeWidth="3.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
        </>
      )}
      {dots.map((dot, i) => {
        const isLast = i === dots.length - 1;
        return (
          <motion.g key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.09, duration: 0.3 }} style={{ transformOrigin: `${dot.x}px ${dot.y}px`, transformBox: "view-box" }}>
            {isLast && <circle cx={dot.x} cy={dot.y} r="11" fill="#f29be3" opacity="0.25" />}
            <circle cx={dot.x} cy={dot.y} r={isLast ? 6 : 4.5} fill="#fff" stroke={isLast ? "#7b67e0" : "#9a88f2"} strokeWidth={isLast ? 3.5 : 2.5} />
          </motion.g>
        );
      })}
      {labels.map((i) => (
        <text key={i} x={dots[i].x} y={BOX.height - 8} textAnchor={dots.length === 1 ? "middle" : i === 0 ? "start" : i === dots.length - 1 ? "end" : "middle"} fontSize="10.5" fill="#6b6585">
          {day(trend.points[i].at)}
        </text>
      ))}
    </svg>
  );
}

function TrendCard({ kid, kind, trend }: { kid: Kid; kind: (typeof KINDS)[number]; trend: Trend | null }) {
  if (!trend) {
    return (
      <div className={`${card} text-center`}>
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${kind.tone}`}>
          <Icon name={kind.icon} size={30} />
        </span>
        <p className="mt-3 text-[17px] font-semibold">No {kind.label.toLowerCase()} check yet</p>
        <p className="mt-1 text-sm text-night-soft">One minute shows where {kid.name} is today. Repeat it weekly and the line appears here.</p>
        <motion.div whileTap={{ scale: 0.96 }} className="mt-4">
          <Link href="/checkup" className="flex h-12 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white">
            Start the check
          </Link>
        </motion.div>
      </div>
    );
  }
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">{kind.label} check</p>
        <span className={`flex-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_TONE[trend.latest.verdict]}`}>{VERDICT_LABEL[trend.latest.verdict]}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[44px] font-semibold leading-none">{trend.latest.score}</span>
        <span className="pb-1 text-sm text-night-soft">{kind.unit}</span>
      </div>
      <p className="mt-1.5 text-sm font-medium">{changeText(trend)}</p>
      <Chart trend={trend} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Best", value: String(trend.best) },
          { label: "Goal", value: String(trend.target) },
          { label: "Correct", value: `${Math.round(trend.latest.accuracy * 100)}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-mist py-2.5">
            <span className="block text-lg font-semibold leading-none">{s.value}</span>
            <span className="mt-1 block text-xs text-night-soft">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ checks }: { checks: CheckRecord[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? checks : checks.slice(0, 5);
  return (
    <div className={card}>
      <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">Every check</p>
      <ul className="mt-2 divide-y divide-night/5">
        {shown.map((c) => {
          const kind = KINDS.find((k) => k.kind === c.kind)!;
          return (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${kind.tone}`}>
                <Icon name={kind.icon} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium leading-tight">
                  {c.score} {kind.unit}
                </span>
                <span className="text-xs text-night-soft">
                  {kind.label} · {day(c.at)} · {Math.round(c.accuracy * 100)}% correct
                </span>
              </span>
              <span className={`ml-auto h-2.5 w-2.5 flex-none rounded-full ${VERDICT_TONE[c.verdict]}`} title={VERDICT_LABEL[c.verdict]} />
            </li>
          );
        })}
      </ul>
      {checks.length > 5 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 h-11 w-full rounded-full bg-lilac-soft text-sm font-semibold">
          {all ? "Show fewer" : `Show all ${checks.length}`}
        </button>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const { ready, kids, active } = useFamily();
  const checks = useChecks(active?.id);
  const [picked, setPicked] = useState<CheckKind | null>(null);

  if (!ready) return <div className="h-40 animate-pulse rounded-[28px] bg-lilac-soft" />;
  if (!active) {
    return (
      <>
        <ScreenHeader title="Progress" subtitle="Is your child growing over time?" />
        <div className={`${card} text-center`}>
          <p className="text-[17px] font-semibold">Add a child first</p>
          <Link href="/welcome" className="mt-4 flex h-12 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white">
            Add a child
          </Link>
        </div>
      </>
    );
  }

  const kindId = picked ?? checks[0]?.kind ?? (active.grade <= 0 ? "letters" : "reading");
  const kind = KINDS.find((k) => k.kind === kindId)!;

  return (
    <Stagger className="grid gap-5">
      <ScreenHeader
        title="Progress"
        subtitle={`${active.name} · ${gradeLabel(active.grade)}`}
        right={
          kids.length > 1 ? (
            <div className="flex gap-2" role="tablist" aria-label="Children">
              {kids.map((kid) => (
                <motion.button key={kid.id} role="tab" aria-selected={kid.id === active.id} aria-label={kid.name} whileTap={{ scale: 0.9 }} onClick={() => { familyActions.setActive(kid.id); setPicked(null); }} className={kid.id === active.id ? "" : "opacity-55"}>
                  <AvatarBubble animal={kid.avatar} size={44} selected={kid.id === active.id} follow={false} />
                </motion.button>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "star" as const, size: 22, value: active.stars, label: "stars", tone: "bg-peach/60" },
          { icon: "flame" as const, size: 26, value: active.streakDays, label: "day streak", tone: "bg-candy/50" },
          { icon: "check" as const, size: 20, value: checks.length, label: checks.length === 1 ? "check" : "checks", tone: "bg-mint/70" },
        ].map((s) => (
          <div key={s.label} className={`rounded-[22px] p-3.5 ${s.tone}`}>
            {/* Equal chips, so icons of different shapes line up with the text and look the same size. */}
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/65">
              <Icon name={s.icon} size={s.size} />
            </span>
            <span className="mt-2.5 block text-[22px] font-semibold leading-none">{s.value}</span>
            <span className="mt-1 block text-xs font-medium text-night/70">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 rounded-full bg-white p-1 shadow-[0_6px_20px_rgba(27,20,51,0.06)]" role="tablist" aria-label="Kind of check">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" role="tab" aria-selected={k.kind === kindId} onClick={() => setPicked(k.kind)} className="relative h-10 rounded-full text-sm font-semibold">
            {k.kind === kindId && <motion.span layoutId="progress-kind" className="absolute inset-0 rounded-full bg-night" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={`relative ${k.kind === kindId ? "text-white" : "text-night-soft"}`}>{k.label}</span>
          </button>
        ))}
      </div>

      <TrendCard key={`${active.id}-${kindId}`} kid={active} kind={kind} trend={trendFor(checks, kindId)} />

      {checks.length > 0 ? <History key={active.id} checks={checks} /> : null}

      <div className={`grid gap-3 ${checks.length ? "grid-cols-2" : ""}`}>
        {checks.length > 0 && (
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link href="/checkup" className="flex h-14 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white">
              New check
            </Link>
          </motion.div>
        )}
        <motion.div whileTap={{ scale: 0.96 }}>
          <Link href="/assistant" className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-white text-[15px] font-semibold shadow-[0_6px_20px_rgba(27,20,51,0.06)]">
            <Orb size={26} /> Ask about it
          </Link>
        </motion.div>
      </div>
    </Stagger>
  );
}
