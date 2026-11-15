"use client";

// Talk to Buddy: the child's assistant, inside kid mode. Big buttons and hold-to-talk; Buddy
// answers out loud. Safe by design (src/lib/buddy.ts): nothing the child says goes to an AI, and
// Buddy can only cheer, count stars, start stories and open games.

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { ParentGate } from "@/components/kid/parent-gate";
import { clay, KidStage } from "@/components/kid/stage";
import { BUDDY_CHIPS, type BuddyReply, buddyReply } from "@/lib/buddy";
import { useDictation } from "@/lib/speech/dictation";
import { say } from "@/lib/speech/say";
import { diaryActions, useDiary } from "@/lib/store/diary";
import { familyActions, useFamily } from "@/lib/store/family";

export default function BuddyPage() {
  const router = useRouter();
  const { ready, active: kid } = useFamily();
  const [reply, setReply] = useState<BuddyReply | null>(null);
  const [cheer, setCheer] = useState(false);
  const diary = useDiary(kid?.id);

  useEffect(() => {
    if (ready && !kid) router.replace("/welcome");
  }, [ready, kid, router]);

  function talk(text: string) {
    if (!kid) return;
    // One bonus star a day: Buddy's note in today's diary means the star was already given.
    const today = new Date().toDateString();
    const cheeredToday = diary.some((e) => e.text.startsWith(`${kid.name} told Buddy`) && new Date(e.at).toDateString() === today);
    const r = buddyReply(text, kid, cheeredToday);
    setReply(r);
    say(r.say);
    if (r.bonusStar) {
      familyActions.updateKid(kid.id, { stars: kid.stars + 1 });
      setCheer(true);
      setTimeout(() => setCheer(false), 1600);
    }
    if (r.noteForParent) diaryActions.add({ kidId: kid.id, text: r.noteForParent });
  }

  const dictation = useDictation(talk);

  if (!kid) return <div className="min-h-dvh flex-1 bg-sky" />;
  const bubble = dictation.listening ? dictation.heard || "I’m listening…" : (reply?.say ?? `Hi ${kid.name}! What shall we do?`);

  return (
    <KidStage>
      <div className="relative flex items-center justify-between">
        <ParentGate onOpen={() => router.push("/home")} />
        <Link href="/play" className="rounded-full bg-white/85 px-4 py-2 text-base font-semibold shadow-[0_6px_14px_-6px_rgba(27,20,51,0.25)]">
          Games
        </Link>
      </div>

      <div className="relative mt-5 grid justify-items-center">
        <div className="grid min-h-[96px] items-end">
          <AnimatePresence mode="wait">
            <motion.p
              key={bubble}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[300px] rounded-[26px] bg-white px-5 py-3 text-center text-[21px] font-medium leading-tight shadow-[0_12px_24px_-8px_rgba(27,20,51,0.22)]"
              aria-live="polite"
            >
              {bubble}
              <span className="absolute -bottom-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[4px] bg-white" aria-hidden="true" />
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="mt-3">
          <AnimalBuddy animal={kid.avatar} size={180} mood={cheer ? "cheer" : "happy"} />
        </div>
      </div>

      {reply?.open ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.95 }} className="relative mt-4">
          <Link href={reply.open.href} className={`flex h-16 items-center justify-center rounded-full bg-night text-xl font-semibold text-white ${clay}`}>
            {reply.open.label} →
          </Link>
        </motion.div>
      ) : null}

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        {BUDDY_CHIPS.map((c) => (
          <motion.button key={c.label} type="button" whileTap={{ scale: 0.92 }} onClick={() => talk(c.ask)} className={`min-h-[72px] rounded-[26px] bg-white/90 px-3 text-lg font-medium leading-tight ${clay}`}>
            {c.label}
          </motion.button>
        ))}
      </div>

      {dictation.supported ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onPointerDown={(e) => {
            e.preventDefault();
            dictation.start();
          }}
          onPointerUp={dictation.stop}
          onPointerLeave={() => dictation.listening && dictation.stop()}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={dictation.listening ? "Listening: let go when you're done" : "Hold to talk to Buddy"}
          className={`relative mt-auto flex h-[72px] touch-none select-none items-center justify-center gap-3 rounded-full text-xl font-semibold ${dictation.listening ? "bg-candy" : "bg-white"} ${clay}`}
        >
          <span className="assistant-orb h-9 w-9 rounded-full" aria-hidden="true" />
          {dictation.listening ? "Listening…" : "Hold to talk"}
        </motion.button>
      ) : null}
    </KidStage>
  );
}
