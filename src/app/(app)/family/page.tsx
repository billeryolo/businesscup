"use client";

// Family: the children on this phone, the few settings there are, and what is stored. Editing a
// child opens a sheet with the same form the welcome flow uses.

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { Icon } from "@/components/icons";
import { ChildForm } from "@/components/onboarding/child-form";
import { ScreenHeader, Stagger } from "@/components/app/screen";
import { say } from "@/lib/speech/say";
import { chatActions } from "@/lib/store/assistant";
import { checkActions, useAllChecks } from "@/lib/store/checks";
import { familyActions, gradeLabel, type Kid, MAX_KIDS, minutesFor, useFamily } from "@/lib/store/family";
import { settingsActions, useSettings } from "@/lib/store/settings";

const card = "rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";
const label = "text-xs font-semibold uppercase tracking-widest text-night-soft";

const Pencil = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.500 19.500l1-4.200L16.200 4.600a1.800 1.800 0 0 1 2.500 0l.7.700a1.800 1.800 0 0 1 0 2.500L8.700 18.500z" />
    <path d="M14.500 6.300l3.200 3.200" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-night/40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.500 5.500 16 12l-6.500 6.500" />
  </svg>
);

function ChildCard({ kid, active, checks, onEdit }: { kid: Kid; active: boolean; checks: number; onEdit: () => void }) {
  return (
    <div className={`${card} ${active ? "ring-2 ring-night" : ""}`}>
      <div className="flex items-center gap-4">
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => familyActions.setActive(kid.id)} aria-label={`Make ${kid.name} the active child`} className="flex-none">
          <AvatarBubble animal={kid.avatar} size={64} mood={active ? "happy" : "idle"} follow={false} />
        </motion.button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-lg font-semibold leading-tight">{kid.name}</span>
            {active && <span className="flex-none rounded-full bg-lilac-soft px-2.5 py-0.5 text-xs font-semibold">Active</span>}
          </div>
          <span className="text-sm text-night-soft">
            {gradeLabel(kid.grade)} · {minutesFor(kid.grade)} min a day
          </span>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onEdit} aria-label={`Edit ${kid.name}`} className="grid h-11 w-11 flex-none place-items-center rounded-full bg-mist">
          <Pencil />
        </motion.button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { value: kid.stars, text: "stars" },
          { value: kid.streakDays, text: "day streak" },
          { value: checks, text: checks === 1 ? "check" : "checks" },
        ].map((s) => (
          <div key={s.text} className="rounded-2xl bg-mist py-2.5">
            <span className="block text-lg font-semibold leading-none">{s.value}</span>
            <span className="mt-1 block text-xs text-night-soft">{s.text}</span>
          </div>
        ))}
      </div>
      {!active && (
        <button type="button" onClick={() => familyActions.setActive(kid.id)} className="mt-3 h-11 w-full rounded-full bg-lilac-soft text-sm font-semibold">
          Switch to {kid.name}
        </button>
      )}
    </div>
  );
}

function EditSheet({ kid, onClose }: { kid: Kid; onClose: () => void }) {
  const [asking, setAsking] = useState(false);
  const remove = () => {
    checkActions.removeForKid(kid.id);
    chatActions.clear(kid.id);
    familyActions.removeKid(kid.id);
    onClose();
  };
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-night/40" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${kid.name}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="relative flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[32px] bg-mist px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3"
      >
        <span className="mx-auto mb-4 h-1.5 w-11 flex-none rounded-full bg-night/15" />
        <ChildForm
          initial={kid}
          submitLabel="Save"
          onSubmit={(draft) => {
            familyActions.updateKid(kid.id, draft);
            onClose();
          }}
        />
        {asking ? (
          <div className="mt-3 flex-none rounded-[24px] bg-white p-4 text-center">
            <p className="text-[15px] font-medium">Remove {kid.name}, with all stars and checks?</p>
            <p className="mt-1 text-xs text-night-soft">This cannot be undone.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAsking(false)} className="h-11 rounded-full bg-mist text-sm font-semibold">
                Keep
              </button>
              <button type="button" onClick={remove} className="h-11 rounded-full bg-[#e5484d] text-sm font-semibold text-white">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAsking(true)} className="mt-3 h-11 flex-none text-sm font-semibold text-[#c93a3f]">
            Remove {kid.name}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function Switch({ on, onChange, name }: { on: boolean; onChange: (next: boolean) => void; name: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={name} onClick={() => onChange(!on)} className={`relative h-8 w-[54px] flex-none rounded-full transition-colors ${on ? "bg-night" : "bg-night/15"}`}>
      <motion.span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(27,20,51,0.25)]" animate={{ x: on ? 22 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
    </button>
  );
}

export default function FamilyPage() {
  const router = useRouter();
  const { ready, kids, active } = useFamily();
  const checks = useAllChecks();
  const settings = useSettings();
  const [editing, setEditing] = useState<string | null>(null);
  const [erasing, setErasing] = useState(false);

  if (!ready) return <div className="h-40 animate-pulse rounded-[28px] bg-lilac-soft" />;
  const edited = kids.find((k) => k.id === editing) ?? null;

  const eraseAll = () => {
    checkActions.clearAll();
    chatActions.clearAll();
    settingsActions.reset();
    familyActions.clearAll();
    router.replace("/welcome");
  };

  return (
    <>
      <Stagger className="grid gap-5">
        <ScreenHeader title="Family" subtitle={kids.length === 1 ? "1 child on this phone" : `${kids.length} children on this phone`} />

        <div className="grid gap-3">
          {kids.map((kid) => (
            <ChildCard key={kid.id} kid={kid} active={kid.id === active?.id} checks={checks.filter((c) => c.kidId === kid.id).length} onEdit={() => setEditing(kid.id)} />
          ))}
          {kids.length < MAX_KIDS ? (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link href="/welcome" className="flex h-[72px] items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-night/20 text-[15px] font-semibold text-night-soft">
                <Icon name="plus" size={24} /> Add a child
              </Link>
            </motion.div>
          ) : (
            <p className="text-center text-sm text-night-soft">Up to {MAX_KIDS} children fit on one phone.</p>
          )}
        </div>

        <div className={card}>
          <p className={label}>Settings</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">Voice in games</p>
              <p className="text-sm text-night-soft">Letters, words and stories are read out loud.</p>
            </div>
            <Switch
              name="Voice in games"
              on={settings.voice}
              onChange={(next) => {
                settingsActions.set({ voice: next });
                if (next) say("Voice is on");
              }}
            />
          </div>
        </div>

        <div className={card}>
          <p className={label}>Your data</p>
          <p className="mt-3 text-[15px] leading-snug">Everything is kept on this phone: no account, no sign-in. Names never leave it, not even when you ask the assistant.</p>
          {erasing ? (
            <div className="mt-4 rounded-[22px] bg-mist p-4 text-center">
              <p className="text-[15px] font-medium">Erase every child, star, check and chat?</p>
              <p className="mt-1 text-xs text-night-soft">This cannot be undone.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setErasing(false)} className="h-11 rounded-full bg-white text-sm font-semibold">
                  Keep
                </button>
                <button type="button" onClick={eraseAll} className="h-11 rounded-full bg-[#e5484d] text-sm font-semibold text-white">
                  Erase
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setErasing(true)} className="mt-4 h-12 w-full rounded-full bg-mist text-[15px] font-semibold text-[#c93a3f]">
              Erase everything
            </button>
          )}
        </div>

        <div className={`${card} py-2`}>
          {[
            { href: "/about", text: "About ReadCheck" },
            { href: "/privacy", text: "Privacy" },
            { href: "/terms", text: "Terms" },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} className={`flex h-12 items-center justify-between text-[15px] font-medium ${i ? "border-t border-night/5" : ""}`}>
              {item.text}
              <Chevron />
            </Link>
          ))}
        </div>
      </Stagger>

      <AnimatePresence>{edited && <EditSheet key={edited.id} kid={edited} onClose={() => setEditing(null)} />}</AnimatePresence>
    </>
  );
}
