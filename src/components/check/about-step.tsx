"use client";

import { useState } from "react";
import { GRADES, type Grade } from "@/lib/reading/norms";
import { Button } from "@/components/ui";

const GRADE_LABEL: Record<Grade, string> = { 1: "1st grade", 2: "2nd grade", 3: "3rd grade", 4: "4th grade" };

const REASONS = ["Reads slowly", "Guesses words", "Avoids reading", "Homework ends in tears", "The teacher mentioned it", "Just checking"];

type Props = {
  childName: string;
  grade: Grade | null;
  onChange: (childName: string, grade: Grade | null) => void;
  onNext: () => void;
};

export function AboutStep({ childName, grade, onChange, onNext }: Props) {
  const [reasons, setReasons] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Who is reading today?</h1>
        <p className="mt-2 text-ink-soft">One minute of reading aloud, compared with national norms for the grade.</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">First name</span>
        <input
          value={childName}
          maxLength={40}
          autoComplete="off"
          placeholder="Leo"
          onChange={(e) => onChange(e.target.value, grade)}
          className="min-h-12 rounded-xl border-2 border-line bg-sheet px-4 text-lg outline-none focus:border-ink focus:ring-4 focus:ring-sun-soft"
        />
        <span className="text-sm text-ink-soft">Only used on this page. Optional.</span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-semibold">Grade this school year</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={grade === g}
              onClick={() => onChange(childName, g)}
              className={`min-h-14 rounded-xl border-2 px-3 font-semibold transition-colors ${grade === g ? "border-brand bg-brand-soft text-ink" : "border-line bg-sheet text-ink-soft hover:border-ink-faint"}`}
            >
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-semibold">What made you want to check? (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => {
            const on = reasons.includes(r);
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => setReasons((all) => (on ? all.filter((x) => x !== r) : [...all, r]))}
                className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium transition-colors ${on ? "border-brand bg-brand-soft text-ink" : "border-line bg-sheet text-ink-soft hover:border-ink-faint"}`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <Button onClick={onNext} disabled={!grade} className="w-full sm:w-auto">
          Continue
        </Button>
      </div>
    </div>
  );
}
