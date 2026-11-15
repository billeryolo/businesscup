"use client";

// The parent's Home: who is learning, what today looks like, the weekly 1-minute check and the
// latest note from the assistant. The big Play button hands the phone to the child.

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Orb } from "@/components/assistant/orb";
import { AnimalAvatar, AvatarBubble } from "@/components/avatars/animal";
import { Icon, type IconName } from "@/components/icons";
import { ScreenHeader, Stagger } from "@/components/app/screen";
import { VERDICT_LABEL } from "@/lib/checks/result";
import { assistantNote, todayFor } from "@/lib/plan/today";
import { type CheckRecord, useChecks } from "@/lib/store/checks";
import { familyActions, gradeLabel, type Kid, MAX_KIDS, minutesFor, useFamily } from "@/lib/store/family";
import { RoadmapCard } from "@/components/home/roadmap";

const card = "rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";
const UNIT = { reading: "words a minute", math: "facts a minute", letters: "letters a minute" } as const;
const VERDICT_TONE = { onTrack: "bg-mint", practice: "bg-peach/70", talkToTeacher: "bg-candy/60" } as const;

function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

function Today({ kid }: { kid: Kid }) {
  const activities = todayFor(kid);
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-lilac p-6">
      <motion.div className="absolute -right-3 -top-2" initial={{ rotate: 12, scale: 0.6, opacity: 0 }} animate={{ rotate: 8, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.25 }}>
        <AnimalAvatar animal={kid.avatar} size={118} mood="happy" />
      </motion.div>
      <p className="text-sm font-medium text-night/70">Today’s practice</p>
      <p className="mt-1 max-w-[62%] text-[24px] font-semibold leading-tight">
        {minutesFor(kid.grade)} minutes with {kid.name}
      </p>
      <ul className="mt-5 grid gap-2">
        {activities.map((a, i) => (
          <motion.li key={a.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5">
            <span className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${a.tone}`}>
              <Icon name={a.icon} size={22} />
            </span>
            <span className="text-[15px] font-medium">{a.title}</span>
            <span className="ml-auto text-xs font-medium text-night/60">{a.minutes} min</span>
          </motion.li>
        ))}
      </ul>
      <motion.div whileTap={{ scale: 0.96 }} className="mt-5">
        <Link href="/play" className="flex h-14 items-center justify-center gap-2 rounded-full bg-night text-base font-semibold text-white">
          <Icon name="play" size={18} /> Play with {kid.name}
        </Link>
      </motion.div>
      <p className="mt-2.5 text-center text-xs text-night/60">Opens kid mode. Hand the phone over.</p>
    </div>
  );
}

function Stat({ icon, value, label, tone }: { icon: IconName; value: number; label: string; tone: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-[24px] p-4 ${tone}`}>
      <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }}>
        <Icon name={icon} size={32} />
      </motion.span>
      <span>
        <span className="block text-xl font-semibold leading-none">{value}</span>
        <span className="text-xs font-medium text-night/70">{label}</span>
      </span>
    </div>
  );
}

function WeeklyCheck({ kid, latest }: { kid: Kid; latest: CheckRecord | undefined }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">1-minute check</p>
        {latest ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_TONE[latest.verdict]}`}>{VERDICT_LABEL[latest.verdict]}</span> : null}
      </div>
      {latest ? (
        <div className="mt-3 flex items-end gap-2">
          <span className="text-[40px] font-semibold leading-none">{latest.score}</span>
          <span className="pb-1 text-sm text-night-soft">
            {UNIT[latest.kind]} · {daysAgo(latest.at)}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-[15px] leading-snug">No check yet. One minute shows where {kid.name} is today.</p>
      )}
      <motion.div whileTap={{ scale: 0.96 }} className="mt-4">
        <Link href="/checkup" className="flex h-12 items-center justify-center rounded-full bg-lilac-soft text-[15px] font-semibold">
          {latest ? "New check" : "Start the check"}
        </Link>
      </motion.div>
    </div>
  );
}

function AssistantCard({ text }: { text: string }) {
  return (
    <Link href="/assistant" className="flex items-center gap-4 rounded-[28px] bg-gradient-to-br from-white via-lilac-soft to-[#fbe3f6] p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]">
      <Orb size={46} />
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-widest text-night-soft">Assistant</span>
        <span className="mt-1 block text-[15px] leading-snug">{text}</span>
      </span>
      <span className="ml-auto flex-none rounded-full bg-night px-3.5 py-2 text-xs font-semibold text-white">Ask</span>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { ready, kids, active } = useFamily();
  const checks = useChecks(active?.id ?? null);

  useEffect(() => {
    // No child yet: the welcome flow adds one.
    if (ready && !active) router.replace("/welcome");
  }, [ready, active, router]);

  if (!ready || !active) return <div className="h-40 animate-pulse rounded-[28px] bg-lilac-soft" />;
  const latest = checks[0];

  return (
    <Stagger className="grid gap-5">
      <ScreenHeader title={`Hello, ${active.name}’s family!`} subtitle={`${gradeLabel(active.grade)} · ${minutesFor(active.grade)} min a day`} />

      <div className="flex gap-4" role="tablist" aria-label="Children">
        {kids.map((kid) => (
          <motion.button key={kid.id} role="tab" aria-selected={kid.id === active.id} whileTap={{ scale: 0.92 }} onClick={() => familyActions.setActive(kid.id)} className="grid justify-items-center gap-1.5">
            <AvatarBubble animal={kid.avatar} size={68} selected={kid.id === active.id} mood={kid.id === active.id ? "happy" : "idle"} />
            <span className={`text-sm ${kid.id === active.id ? "font-semibold" : "text-night-soft"}`}>{kid.name}</span>
          </motion.button>
        ))}
        {kids.length < MAX_KIDS ? (
          <motion.div whileTap={{ scale: 0.92 }}>
            <Link href="/welcome" className="grid justify-items-center gap-1.5">
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-dashed border-night/25 text-2xl text-night/50">+</span>
              <span className="text-sm text-night-soft">Add child</span>
            </Link>
          </motion.div>
        ) : null}
      </div>

      <RoadmapCard kid={active} checks={checks} />
      <Today key={active.id} kid={active} />

      <div className="grid grid-cols-2 gap-3">
        <Stat icon="star" value={active.stars} label="stars" tone="bg-peach/60" />
        <Stat icon="flame" value={active.streakDays} label="days in a row" tone="bg-candy/50" />
      </div>

      <WeeklyCheck kid={active} latest={latest} />
      <AssistantCard text={assistantNote(active, latest)} />
    </Stagger>
  );
}
