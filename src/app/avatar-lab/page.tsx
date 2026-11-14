"use client";

// A developer page, not linked from the app: every animal in every mood, head-only and full-body.
// Open /avatar-lab to check a change to the avatars at a glance.

import { useState } from "react";
import { AnimalAvatar, AvatarBubble, type Mood } from "@/components/avatars/animal";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { SoftLion } from "@/components/avatars/soft";
import { ANIMALS } from "@/lib/store/family";

const MOODS: Mood[] = ["idle", "happy", "cheer", "oops", "wave"];

export default function AvatarLabPage() {
  const [live, setLive] = useState<Mood>("idle");
  return (
    <main className="min-h-dvh bg-mist p-5 font-app text-night">
      <h1 className="text-2xl font-semibold">Avatar lab</h1>
      <p className="mt-1 text-sm text-night-soft">Every animal in every mood. Tap or move the pointer near a face: the eyes follow.</p>

      <h2 className="mt-6 text-lg font-semibold">Soft 3D trial: lion</h2>
      <p className="text-sm text-night-soft">Current on the left, new on the right.</p>
      <div className="mt-3 flex items-end gap-6 rounded-[28px] bg-white p-5">
        <AnimalBuddy animal="lion" size={150} mood={live} />
        <SoftLion size={180} mood={live} />
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-[28px] bg-sky p-5">
        {MOODS.map((mood) => (
          <div key={mood} className="grid justify-items-center gap-1">
            <SoftLion size={92} mood={mood} />
            <span className="text-xs font-semibold">{mood}</span>
          </div>
        ))}
        <SoftLion size={48} />
      </div>

      <h2 className="mt-6 text-lg font-semibold">Heads</h2>
      <div className="mt-2 grid gap-3">
        {MOODS.map((mood) => (
          <div key={mood} className="flex items-center gap-3">
            <span className="w-12 flex-none text-sm font-semibold">{mood}</span>
            {ANIMALS.map((animal) => (
              <AnimalAvatar key={animal} animal={animal} size={84} mood={mood} />
            ))}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Bodies</h2>
      <div className="mt-2 grid gap-3">
        {MOODS.map((mood) => (
          <div key={mood} className="flex items-end gap-3">
            <span className="w-12 flex-none text-sm font-semibold">{mood}</span>
            {ANIMALS.map((animal) => (
              <AnimalBuddy key={animal} animal={animal} size={96} mood={mood} />
            ))}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Switch mood live</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <button key={mood} type="button" onClick={() => setLive(mood)} className={`rounded-full px-4 py-2 text-sm font-semibold ${live === mood ? "bg-night text-white" : "bg-white"}`}>
            {mood}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        {ANIMALS.map((animal) => (
          <AnimalBuddy key={animal} animal={animal} size={132} mood={live} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {ANIMALS.map((animal) => (
          <AvatarBubble key={animal} animal={animal} size={76} mood={live} />
        ))}
      </div>
    </main>
  );
}
