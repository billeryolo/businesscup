"use client";

// Who is the app for: first name, grade and an animal. The chosen animal sits on top and reacts
// as the parent fills the form in. Also used later to add or edit a child.

import { motion } from "motion/react";
import { useState } from "react";
import { AnimalAvatar, AvatarBubble } from "@/components/avatars/animal";
import { ANIMALS, type AnimalId, type Grade } from "@/lib/store/family";
import { BigButton } from "./bits";

export type ChildDraft = { name: string; grade: Grade; avatar: AnimalId };

const GRADES: { grade: Grade; label: string }[] = [
  { grade: -1, label: "Pre-K" },
  { grade: 0, label: "K" },
  { grade: 1, label: "1" },
  { grade: 2, label: "2" },
  { grade: 3, label: "3" },
  { grade: 4, label: "4" },
];

export function ChildForm({ initial, submitLabel = "Next", onSubmit }: { initial?: ChildDraft; submitLabel?: string; onSubmit: (draft: ChildDraft) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [grade, setGrade] = useState<Grade | null>(initial?.grade ?? null);
  const [avatar, setAvatar] = useState<AnimalId>(initial?.avatar ?? "lion");
  const ready = name.trim().length > 0 && grade !== null;

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit({ name: name.trim(), grade, avatar });
      }}
    >
      <div className="grid justify-items-center gap-2 pb-6">
        {/* Remounting on a new animal replays the pop. */}
        <motion.div key={avatar} initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 14 }}>
          <AvatarBubble animal={avatar} size={120} mood={ready ? "cheer" : name.trim() ? "happy" : "idle"} />
        </motion.div>
        <p className="h-7 font-kid text-xl font-semibold">{name.trim() ? `Hi, ${name.trim()}!` : " "}</p>
      </div>

      <label className="text-sm font-semibold" htmlFor="kid-name">
        Child’s first name
      </label>
      <input
        id="kid-name"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 20))}
        autoComplete="off"
        placeholder="Mia"
        className="mt-2 h-14 rounded-2xl bg-white px-5 text-lg font-medium outline-none ring-2 ring-transparent transition-shadow placeholder:text-night/30 focus:ring-night"
      />

      <p className="mt-6 text-sm font-semibold" id="grade-label">
        Grade
      </p>
      <div className="mt-2 grid grid-cols-6 gap-2" role="radiogroup" aria-labelledby="grade-label">
        {GRADES.map((g) => {
          const on = g.grade === grade;
          return (
            <motion.button
              key={g.grade}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={g.grade === -1 ? "Pre-K" : g.grade === 0 ? "Kindergarten" : `Grade ${g.grade}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => setGrade(g.grade)}
              className={`h-12 rounded-2xl text-[15px] font-semibold transition-colors ${on ? "bg-night text-white" : "bg-white text-night"}`}
            >
              {g.label}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-6 text-sm font-semibold" id="avatar-label">
        Pick a friend
      </p>
      <div className="mt-3 grid grid-cols-6 gap-2" role="radiogroup" aria-labelledby="avatar-label">
        {ANIMALS.map((animal) => {
          const on = animal === avatar;
          return (
            <motion.button
              key={animal}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={animal}
              whileTap={{ scale: 0.85 }}
              animate={{ y: on ? -4 : 0 }}
              onClick={() => setAvatar(animal)}
              className={`grid aspect-square place-items-center rounded-full bg-white transition-shadow ${on ? "ring-[3px] ring-night" : "shadow-[0_4px_12px_rgba(27,20,51,0.08)]"}`}
            >
              <AnimalAvatar animal={animal} size={40} mood={on ? "happy" : "idle"} />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <BigButton disabled={!ready} onClick={() => ready && onSubmit({ name: name.trim(), grade, avatar })}>
          {submitLabel}
        </BigButton>
      </div>
    </form>
  );
}
