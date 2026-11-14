"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { ComingNext, ScreenHeader, Stagger } from "@/components/app/screen";
import { familyActions, gradeLabel, minutesFor, useFamily } from "@/lib/store/family";

export default function HomePage() {
  const router = useRouter();
  const { ready, kids, active } = useFamily();

  useEffect(() => {
    if (ready && !active) router.replace("/welcome");
  }, [ready, active, router]);

  if (!ready || !active) return <div className="h-40 animate-pulse rounded-[28px] bg-lilac-soft" />;

  // No child yet: the welcome flow adds one.
  return (
    <Stagger className="grid gap-5">
      <ScreenHeader title={`Hello, ${active.name}’s family!`} subtitle={`${gradeLabel(active.grade)} · ${minutesFor(active.grade)} min a day`} />

      <div className="flex gap-4" role="tablist" aria-label="Children">
        {kids.map((kid) => (
          <motion.button
            key={kid.id}
            role="tab"
            aria-selected={kid.id === active.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => familyActions.setActive(kid.id)}
            className="grid justify-items-center gap-1.5"
          >
            <AvatarBubble animal={kid.avatar} size={68} selected={kid.id === active.id} mood={kid.id === active.id ? "happy" : "idle"} />
            <span className={`text-sm ${kid.id === active.id ? "font-semibold" : "text-night-soft"}`}>{kid.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-lilac p-6">
        <p className="text-sm font-medium text-night/70">Today’s practice</p>
        <p className="mt-1 text-[22px] font-semibold leading-tight">{minutesFor(active.grade)} minutes with {active.name}</p>
        <div className="mt-4 flex gap-5 text-sm font-medium">
          <span>⭐ {active.stars} stars</span>
          <span>🔥 {active.streakDays} days in a row</span>
        </div>
      </div>

      <ComingNext items={["Play button that opens kid mode", "Weekly 1-minute check card", "Latest message from the assistant"]} />
    </Stagger>
  );
}
